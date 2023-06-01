import { App, CloudBackend, NamedCloudWorkspace } from "cdktf";
import {BackendStack} from "./lib/BackendStack";

const app = new App();

const stack = new BackendStack(app, 'backend');

new CloudBackend(stack, {
  hostname: "app.terraform.io",
  organization: "JanJaap-WebSolutions",
  workspaces: new NamedCloudWorkspace("eppendorf-coding-challenge")
});

app.synth();
