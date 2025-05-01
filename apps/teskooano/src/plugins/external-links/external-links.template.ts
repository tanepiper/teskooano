const template = document.createElement("template");
template.innerHTML = `
<style>
  /* Import the raw CSS string */
  @import url('./external-links.css');

  .external-links-component-container {
    display: flex;
    gap: var(--space-xs, 4px); /* Add a small gap between buttons */
    align-items: center;
  }
</style>
<div class="external-links-component-container">
  <!-- Buttons will be appended here by the component logic -->
</div>
`;

export { template };
