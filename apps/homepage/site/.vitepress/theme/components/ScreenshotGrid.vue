<script setup>
import { defineProps, computed } from "vue";
import { useEasyLightbox } from "vue-easy-lightbox";

const props = defineProps({
  basePath: {
    type: String,
    default: "/plan/00000/",
  },
  images: {
    type: Array,
    default: () => [],
  },
  columns: {
    type: Number,
    default: 3,
  },
  gap: {
    type: String,
    default: "0.5rem",
  },
});

// Process the images to ensure they have full paths and all required properties
const processedImages = computed(() => {
  return props.images.map((image) => {
    // Handle both string filenames and object formats
    if (typeof image === "string") {
      return {
        src: `${props.basePath}${image}`,
        alt: image.replace(/\.[^/.]+$/, ""), // Remove file extension for alt
        caption: "",
      };
    } else {
      // Handle object format, ensuring src has the correct path if not already absolute
      const src =
        image.src.startsWith("http") || image.src.startsWith("/")
          ? image.src
          : `${props.basePath}${image.src}`;

      return {
        src,
        alt: image.alt || image.src.replace(/\.[^/.]+$/, ""),
        caption: image.caption || "",
      };
    }
  });
});

// Prepare image sources for the lightbox
const lightboxImgs = computed(() => processedImages.value.map((s) => s.src));

// Use the composable for lightbox state
const {
  show: showLightbox,
  onHide,
  visibleRef,
  indexRef,
  imgsRef,
} = useEasyLightbox({
  imgs: lightboxImgs.value,
  initIndex: 0,
});

// Function to show lightbox for a specific image index
const openLightbox = (index) => {
  imgsRef.value = lightboxImgs.value;
  indexRef.value = index;
  showLightbox();
};

// Compute the CSS for the grid
const gridStyle = computed(() => {
  return {
    display: "grid",
    gridTemplateColumns: `repeat(${props.columns}, 1fr)`,
    gap: props.gap,
  };
});
</script>

<template>
  <div class="screenshot-grid" :style="gridStyle">
    <div
      v-for="(image, index) in processedImages"
      :key="index"
      class="screenshot-item"
      @click="openLightbox(index)"
    >
      <img :src="image.src" :alt="image.alt" />
      <div v-if="image.caption" class="caption">{{ image.caption }}</div>
    </div>
  </div>

  <vue-easy-lightbox
    :visible="visibleRef"
    :imgs="imgsRef"
    :index="indexRef"
    @hide="onHide"
  />
</template>

<style scoped>
.screenshot-grid {
  margin: 1.5rem 0;
}

.screenshot-item {
  border-radius: 4px;
  overflow: hidden;
  position: relative;
  cursor: pointer;
  transition: transform 0.2s;
}

.screenshot-item:hover {
  transform: scale(1.02);
}

.screenshot-item img {
  width: 100%;
  height: auto;
  display: block;
}

.caption {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 0.5rem;
  font-size: 0.8rem;
  opacity: 0;
  transition: opacity 0.3s;
}

.screenshot-item:hover .caption {
  opacity: 1;
}
</style>
