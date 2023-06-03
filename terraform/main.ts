import { App, CloudBackend, NamedCloudWorkspace } from "cdktf";
import {BackendStack} from "./lib/BackendStack";
import {FrontendStack} from "./lib/FrontendStack";




const app = new App();

const backendStack = new BackendStack(app, 'backend');

new CloudBackend(backendStack, {
  hostname: "app.terraform.io",
  organization: "JanJaap-WebSolutions",
  workspaces: new NamedCloudWorkspace("eppendorf-coding-challenge-backend")
});


const frontendStack = new FrontendStack(app, 'frontend');

new CloudBackend(frontendStack, {
  hostname: "app.terraform.io",
  organization: "JanJaap-WebSolutions",
  workspaces: new NamedCloudWorkspace("eppendorf-coding-challenge-frontend")
});

app.synth();
