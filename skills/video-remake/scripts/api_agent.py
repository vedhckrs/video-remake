"""Run a world-drawing / kit-building agent on Ved's own Anthropic API credit (Claude Fable 5.2, effort high) with a
HARD dollar cap per act (Ved, 26 Nov 2026: "upcoming work agent use Fable 5.2 high effort agent from API credit, each
Act make API cap 25$ max").

A self-hosted agent loop (Messages API + client-side tools) because the work needs this PC: the Remotion engine, its
node_modules, the render scripts and the reference photos. Tools: Anthropic's bash and text-editor tools plus
`view_image` (the agent LOOKS at the stills it renders). Every request is priced from `response.usage` and written to
one ledger per act, shared by all agents of that act; an agent stops BEFORE a request that could cross the cap.

Auth: the SDK's default chain - the `ant auth login` profile (preferred) or ANTHROPIC_API_KEY. This script never reads,
prints or stores a key, and never hands credentials to the commands the agent runs.

usage (core env python):
  api_agent.py run --act <act-id> --name <agent> --brief <brief.md> --root <work dir> [--read <dir> ...]
                   [--cap 25] [--effort high] [--max-turns 160] [--agent-cap <usd>]
  api_agent.py status --act <act-id> [--cap 25]

--root   the only folder the agent may write to with the editor (bash runs there; keep each agent in its own sandbox).
--read   extra folders the editor / view_image may READ (skill docs, reference photos, the kit).
Files: <VB>/remakes/api_ledger/<act>.json (ledger), <root>/_api_agent/<name>.jsonl (transcript), <name>.report.md.
"""
import argparse
import base64
import io
import json
import os
import re
import subprocess
import sys
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

MODEL = "claude-fable-5-2"
# $ per token - Claude Fable 5.2: $8 in / $40 out per MTok, cache write (5 min) 1.25x, cache read $0.20
P_IN, P_OUT, P_CW, P_CR = 8e-6, 40e-6, 10e-6, 0.2e-6
MAX_TOKENS = 32000
BASH_TIMEOUT = 240          # s - under the 5 min cache lifetime, so a long command never costs a full cache re-write
OUT_LIMIT = 16000           # characters of command output returned to the model
SAFETY = 0.75               # $ kept free under the cap for requests already in flight from parallel agents

SYSTEM = (
    "You are a senior motion designer and React/Remotion engineer working alone on one task on a Windows PC. "
    "You have a bash tool (Git Bash; each call is a fresh shell in your work folder, limit {t} s - split long jobs, "
    "render single stills rather than whole videos), a text editor tool, and view_image to LOOK at images you render "
    "or reference photos. Work in a loop: read the brief and the files it names, build, render stills, look at them "
    "critically, fix, repeat. You are spending the owner's money: read only what you need, prefer one well-aimed "
    "command over many, never print large files, and stop when the brief's deliverables are met. "
    "Rules: write only inside your work folder; never run git commit / push / branch commands; never read, print or "
    "copy API keys or credential files; nothing paid; no network downloads except image files the brief asks for. "
    "Finish with a plain report: what you built (paths), how you checked it, what is still weak."
).format(t=BASH_TIMEOUT)

DENY = [r"\bgit\s+(commit|push|switch|checkout|branch|merge|reset|rebase)\b", r"api_key", r"\.config[\\/](elevenlabs|higgsfield|huggingface)",
        r"credentials[\\/]", r"print-credentials", r"\bant\s+auth\b", r"AlphaTech Youtube", r"\brm\s+-rf\s+[/~]", r"\bformat\s+[a-z]:",
        r"\bnpm\s+(i|install)\s+-g\b", r"\bwinget\b", r"\bshutdown\b"]


def vb_home():
    return Path(os.environ.get("VB_HOME") or r"D:\VideoBlueprint")


def ledger_path(act):
    d = vb_home() / "remakes" / "api_ledger"
    d.mkdir(parents=True, exist_ok=True)
    return d / f"{re.sub(r'[^A-Za-z0-9_.-]', '_', act)}.json"


class Ledger:
    """One JSON file per act, shared by parallel agents; a lock file makes read-modify-write atomic."""

    def __init__(self, act):
        self.p = ledger_path(act)
        self.lock = self.p.with_suffix(".lock")

    def _locked(self, fn):
        t0 = time.time()
        while True:
            try:
                fd = os.open(self.lock, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
                os.close(fd)
                break
            except FileExistsError:
                if time.time() - t0 > 30:      # stale lock from a killed process
                    try:
                        os.unlink(self.lock)
                    except OSError:
                        pass
                time.sleep(0.05)
        try:
            d = json.loads(self.p.read_text(encoding="utf-8")) if self.p.exists() else {"rows": [], "reserved": {}}
            out = fn(d)
            self.p.write_text(json.dumps(d, indent=1), encoding="utf-8")
            return out
        finally:
            try:
                os.unlink(self.lock)
            except OSError:
                pass

    @staticmethod
    def spent(d):
        return sum(r["usd"] for r in d["rows"])

    def reserve(self, name, usd, cap):
        """Book `usd` for the next request. False = the cap would be crossed -> the agent must stop."""
        def fn(d):
            others = sum(v for k, v in d["reserved"].items() if k != name)
            if self.spent(d) + others + usd > cap - SAFETY:
                d["reserved"].pop(name, None)
                return False
            d["reserved"][name] = round(usd, 4)
            return True
        return self._locked(fn)

    def record(self, name, usage, usd):
        def fn(d):
            d["reserved"].pop(name, None)
            d["rows"].append({"agent": name, "t": time.strftime("%Y-%m-%d %H:%M:%S"), **usage, "usd": round(usd, 5)})
            return self.spent(d)
        return self._locked(fn)

    def release(self, name):
        self._locked(lambda d: d["reserved"].pop(name, None))

    def summary(self):
        d = self._locked(lambda d: json.loads(json.dumps(d)))
        per = {}
        for r in d["rows"]:
            a = per.setdefault(r["agent"], {"usd": 0.0, "calls": 0, "out": 0})
            a["usd"] += r["usd"]; a["calls"] += 1; a["out"] += r.get("output_tokens", 0)
        return self.spent(d), per, d["reserved"]


def cost_of(u):
    return (u.get("input_tokens", 0) * P_IN + u.get("output_tokens", 0) * P_OUT
            + u.get("cache_creation_input_tokens", 0) * P_CW + u.get("cache_read_input_tokens", 0) * P_CR)


# ---- tools ------------------------------------------------------------------------------------------------------------

class Tools:
    def __init__(self, root, read_dirs):
        self.root = Path(root).resolve()
        self.read = [self.root] + [Path(r).resolve() for r in read_dirs]
        self.bash_exe = self._find_bash()
        env = {k: v for k, v in os.environ.items()
               if not re.search(r"ANTHROPIC|API_KEY|TOKEN|SECRET|HF_KEY|ELEVEN|XI_", k, re.I)}
        self.env = env

    @staticmethod
    def _find_bash():
        for c in [r"C:\Program Files\Git\bin\bash.exe", r"C:\Program Files\Git\usr\bin\bash.exe"]:
            if Path(c).exists():
                return c
        return "bash"

    def _path(self, p, write=False):
        q = Path(p)
        q = (q if q.is_absolute() else self.root / q).resolve()
        roots = [self.root] if write else self.read
        if not any(q == r or q.is_relative_to(r) for r in roots):
            raise PermissionError(f"path outside the allowed folders ({'write: ' + str(self.root) if write else 'read: ' + ', '.join(map(str, roots))}): {q}")
        if re.search(r"api_key|credentials|\.env$|token$", str(q), re.I):
            raise PermissionError("credential-like files are off limits")
        return q

    def bash(self, inp):
        if inp.get("restart"):
            return "shell restarted (every call is already a fresh shell)"
        cmd = inp.get("command")
        if not isinstance(cmd, str) or not cmd.strip():
            raise ValueError("bash needs a non-empty 'command' string")
        for pat in DENY:
            if re.search(pat, cmd, re.I):
                raise PermissionError(f"command refused by the runner's rules (matched {pat!r})")
        try:
            r = subprocess.run([self.bash_exe, "-lc", cmd], cwd=self.root, env=self.env, stdin=subprocess.DEVNULL,
                               capture_output=True, timeout=BASH_TIMEOUT)
            out = (r.stdout + r.stderr).decode("utf-8", "replace")
            tail = f"\n[exit {r.returncode}]"
        except subprocess.TimeoutExpired as e:
            out = ((e.stdout or b"") + (e.stderr or b"")).decode("utf-8", "replace")
            tail = f"\n[TIMEOUT after {BASH_TIMEOUT} s - split the job or render fewer frames]"
        if len(out) > OUT_LIMIT:
            out = out[:OUT_LIMIT // 4] + f"\n... [{len(out) - OUT_LIMIT} characters cut] ...\n" + out[-OUT_LIMIT * 3 // 4:]
        return out + tail

    def editor(self, inp):
        c = inp.get("command")
        if c == "view":
            p = self._path(inp["path"])
            if p.is_dir():
                items = sorted(p.iterdir(), key=lambda x: (x.is_file(), x.name.lower()))[:300]
                return "\n".join(("  " if x.is_file() else "d ") + x.name for x in items)
            lines = p.read_text(encoding="utf-8", errors="replace").splitlines()
            a, b = 1, len(lines)
            vr = inp.get("view_range")
            if vr:
                a, b = max(1, int(vr[0])), (len(lines) if int(vr[1]) == -1 else min(len(lines), int(vr[1])))
            text = "\n".join(f"{i:6d}\t{lines[i - 1]}" for i in range(a, b + 1))
            if len(text) > 60000:
                text = text[:60000] + f"\n... [cut - file has {len(lines)} lines; use view_range]"
            return text
        p = self._path(inp["path"], write=True)
        if c == "create":
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_text(inp["file_text"], encoding="utf-8", newline="\n")
            return f"created {p} ({len(inp['file_text'])} characters)"
        text = p.read_text(encoding="utf-8")
        if c == "str_replace":
            old, new = inp["old_str"], inp.get("new_str", "")
            n = text.count(old)
            if n != 1:
                raise ValueError(f"old_str must match exactly once; it matches {n} times")
            p.write_text(text.replace(old, new, 1), encoding="utf-8", newline="\n")
            return f"edited {p}"
        if c == "insert":
            lines = text.split("\n")
            k = int(inp["insert_line"])
            lines[k:k] = inp["insert_text"].split("\n")
            p.write_text("\n".join(lines), encoding="utf-8", newline="\n")
            return f"inserted into {p} after line {k}"
        raise ValueError(f"unknown editor command {c!r}")

    def view_image(self, inp):
        from PIL import Image
        paths = inp.get("paths")
        if not isinstance(paths, list) or not paths or not all(isinstance(x, str) for x in paths) or len(paths) > 6:
            raise ValueError("view_image needs 'paths': a list of 1-6 image file paths")
        side = int(inp.get("max_side") or 1280)
        side = max(256, min(1920, side))
        blocks = []
        for raw in paths:
            p = self._path(raw)
            im = Image.open(p).convert("RGB")
            w, h = im.size
            if max(w, h) > side:
                k = side / max(w, h)
                im = im.resize((round(w * k), round(h * k)), Image.LANCZOS)
            buf = io.BytesIO()
            im.save(buf, "JPEG", quality=88)
            blocks.append({"type": "text", "text": f"{p.name} ({w}x{h}, shown at {im.size[0]}x{im.size[1]})"})
            blocks.append({"type": "image", "source": {"type": "base64", "media_type": "image/jpeg",
                                                       "data": base64.standard_b64encode(buf.getvalue()).decode()}})
        return blocks

    def run(self, name, inp):
        if not isinstance(inp, dict):
            raise ValueError("tool input must be an object")
        if name == "bash":
            return self.bash(inp)
        if name == "str_replace_based_edit_tool":
            return self.editor(inp)
        if name == "view_image":
            return self.view_image(inp)
        raise ValueError(f"unknown tool {name!r}")


TOOL_DEFS = [
    {"type": "bash_20250124", "name": "bash"},
    {"type": "text_editor_20250728", "name": "str_replace_based_edit_tool"},
    {"name": "view_image",
     "description": "Look at 1-6 image files (PNG/JPG stills you rendered, contact sheets, reference photos). "
                    "Images are downscaled so the long side is at most max_side px (default 1280; use 1920 only to "
                    "inspect fine detail, 640 for a quick layout check - bigger costs more).",
     "input_schema": {"type": "object", "additionalProperties": False, "required": ["paths"],
                      "properties": {"paths": {"type": "array", "items": {"type": "string"}, "minItems": 1, "maxItems": 6},
                                     "max_side": {"type": "integer"}}}},
]


# ---- the loop ---------------------------------------------------------------------------------------------------------

def run(a):
    import anthropic
    root = Path(a.root).resolve()
    root.mkdir(parents=True, exist_ok=True)
    logd = root / "_api_agent"
    logd.mkdir(exist_ok=True)
    log = (logd / f"{a.name}.jsonl").open("a", encoding="utf-8")
    led = Ledger(a.act)
    tools = Tools(root, a.read or [])
    client = anthropic.Anthropic(max_retries=4)
    brief = Path(a.brief).read_text(encoding="utf-8")
    first = (f"Your work folder (bash cwd, the only place you may write): {root}\n"
             f"Folders you may also read: {', '.join(str(p) for p in tools.read[1:]) or '(none)'}\n\n# Brief\n\n{brief}")
    messages = [{"role": "user", "content": first}]
    system = [{"type": "text", "text": SYSTEM, "cache_control": {"type": "ephemeral"}}]
    mine, last_cost, last_in, stop_note, final = 0.0, 0.0, 0, None, ""

    def say(s):
        print(f"[api_agent:{a.name}] {s}", flush=True)

    for turn in range(1, a.max_turns + 1):
        # worst realistic price of the next request: the whole context re-read from cache (or its new tail written)
        # plus a full answer; never less than twice the previous request
        need = max(2 * last_cost, last_in * P_CR + 30000 * P_CW + 8000 * P_OUT, 0.30)
        if a.agent_cap and mine + need > a.agent_cap:
            stop_note = f"agent cap ${a.agent_cap:.2f} reached (spent ${mine:.2f})"
            break
        if not led.reserve(a.name, need, a.cap):
            stop_note = f"ACT CAP ${a.cap:.2f} reached - stopping before the next request"
            break
        try:
            with client.messages.stream(model=MODEL, max_tokens=MAX_TOKENS, system=system, tools=TOOL_DEFS,
                                        messages=messages, output_config={"effort": a.effort},
                                        cache_control={"type": "ephemeral"}) as stream:
                msg = stream.get_final_message()
        except anthropic.RateLimitError as e:
            led.release(a.name)
            wait = int(e.response.headers.get("retry-after", "30"))
            say(f"rate limited - waiting {wait} s")
            time.sleep(min(wait, 120))
            continue
        except anthropic.APIStatusError as e:
            led.release(a.name)
            stop_note = f"API error {e.status_code}: {e.message}"
            break
        except anthropic.APIConnectionError as e:
            led.release(a.name)
            stop_note = f"network error: {e}"
            break
        u = msg.usage
        usage = {k: getattr(u, k, 0) or 0 for k in ("input_tokens", "output_tokens", "cache_creation_input_tokens", "cache_read_input_tokens")}
        last_cost = cost_of(usage)
        last_in = usage["input_tokens"] + usage["cache_creation_input_tokens"] + usage["cache_read_input_tokens"]
        mine += last_cost
        total = led.record(a.name, usage, last_cost)
        text = "".join(b.text for b in msg.content if b.type == "text")
        calls = [b for b in msg.content if b.type == "tool_use"]
        log.write(json.dumps({"turn": turn, "stop": msg.stop_reason, "usage": usage, "usd": round(last_cost, 4), "text": text,
                              "tools": [{"name": b.name, "input": b.input} for b in calls]}, ensure_ascii=False) + "\n")
        log.flush()
        say(f"turn {turn}: ${last_cost:.3f} (agent ${mine:.2f}, act ${total:.2f}/{a.cap:.0f}) ctx {last_in // 1000}k "
            f"{msg.stop_reason} {[b.name + ':' + str(b.input.get('command', b.input.get('paths', '')))[:70] for b in calls]}")
        if text:
            final = text
        messages.append({"role": "assistant", "content": msg.content})   # unchanged, thinking blocks included
        if msg.stop_reason == "refusal":
            d = msg.stop_details
            stop_note = f"the model declined ({getattr(d, 'category', None)}): {getattr(d, 'explanation', '')}"
            break
        if msg.stop_reason == "max_tokens":
            results = [{"type": "tool_result", "tool_use_id": b.id, "is_error": True,
                        "content": "The reply hit the output limit before this call was complete - send it again, smaller."} for b in calls]
            messages.append({"role": "user", "content": results + [{"type": "text", "text": "You hit the output limit. Continue; write big files in parts."}]})
            continue
        if msg.stop_reason != "tool_use":
            break
        results = []
        for b in calls:
            try:
                out = tools.run(b.name, b.input)
                results.append({"type": "tool_result", "tool_use_id": b.id, "content": out})
            except Exception as e:  # noqa: BLE001 - every tool failure goes back to the model as an error result
                results.append({"type": "tool_result", "tool_use_id": b.id, "content": f"{type(e).__name__}: {e}", "is_error": True})
        left = a.cap - SAFETY - total
        results.append({"type": "text", "text": f"[budget: ${left:.2f} left for this act across all agents; {a.max_turns - turn} turns left for you"
                                                + (" - WRAP UP NOW: finish the current fix, save, and write your report" if left < 2.0 or a.max_turns - turn < 6 else "") + "]"})
        messages.append({"role": "user", "content": results})
    else:
        stop_note = f"turn limit {a.max_turns} reached"
    led.release(a.name)
    rep = logd / f"{a.name}.report.md"
    rep.write_text(f"# {a.name} - API agent report\n\nspent ${mine:.2f} (act ledger: {led.p})\n"
                   + (f"\n**Stopped early:** {stop_note}\n" if stop_note else "") + f"\n{final}\n", encoding="utf-8")
    say(f"DONE spent ${mine:.2f}" + (f" - STOPPED: {stop_note}" if stop_note else "") + f" - report {rep}")
    return 2 if stop_note else 0


def status(a):
    spent, per, reserved = Ledger(a.act).summary()
    print(f"act {a.act}: spent ${spent:.2f} of ${a.cap:.2f} cap (${a.cap - spent:.2f} left)")
    for k, v in sorted(per.items()):
        print(f"  {k:24s} ${v['usd']:.2f}  {v['calls']} requests  {v['out'] // 1000}k output tokens")
    if reserved:
        print("  in flight:", reserved)


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    sub = ap.add_subparsers(dest="cmd", required=True)
    r = sub.add_parser("run")
    r.add_argument("--act", required=True); r.add_argument("--name", required=True)
    r.add_argument("--brief", required=True); r.add_argument("--root", required=True)
    r.add_argument("--read", action="append"); r.add_argument("--cap", type=float, default=25.0)
    r.add_argument("--agent-cap", type=float, default=0.0)
    r.add_argument("--effort", default="high", choices=["low", "medium", "high", "xhigh", "max"])
    r.add_argument("--max-turns", type=int, default=160)
    s = sub.add_parser("status")
    s.add_argument("--act", required=True); s.add_argument("--cap", type=float, default=25.0)
    a = ap.parse_args()
    sys.exit(run(a) if a.cmd == "run" else status(a))


if __name__ == "__main__":
    main()
