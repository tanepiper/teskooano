import EyeIcon from "@fluentui/svg-icons/icons/eye_20_regular.svg?raw";
import ArrowStepOverRegular from "@fluentui/svg-icons/icons/arrow_step_over_20_regular.svg?raw";

const buttonTemplate = document.createElement("template");
buttonTemplate.innerHTML = `
<div class="action-buttons">
  <teskooano-button size="sm" id="follow-btn" title="Follow Object" appearance="stealth">
    <span slot="icon">${ArrowStepOverRegular}</span>
  </teskooano-button>
  <teskooano-action-menu id="celestial-menu" direction="left">
    <teskooano-button size="sm" id="focus-btn" title="Focus Camera" appearance="stealth">
      <span slot="icon">${EyeIcon}</span>
    </teskooano-button>
  </teskooano-action-menu>
</div>
`;

export { buttonTemplate };
