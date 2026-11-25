import {Config} from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
Config.setOverwriteOutput(true);
Config.setConcurrency(4);
// public/ holds every project's audio under public/<project-id>/
Config.setPublicDir('public');
