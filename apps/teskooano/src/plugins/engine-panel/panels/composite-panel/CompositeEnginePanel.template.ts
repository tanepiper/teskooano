import "./Home.component";

export const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      display: block;
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      overflow: hidden;
      position: relative;
    }

    .engine-container {
      width: 100%;
      height: 100%;
      position: absolute;
      top: 0;
      left: 0;
      cursor: crosshair;
    }

  </style>
  <div class="engine-container" id="engine-container"></div>
  <teskooano-engine-toolbar></teskooano-engine-toolbar>
  <teskooano-home id="engine-placeholder-wrapper"></teskooano-home>
`;
