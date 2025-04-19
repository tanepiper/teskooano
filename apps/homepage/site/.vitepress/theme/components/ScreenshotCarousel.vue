<script setup>
import { ref, computed } from "vue";
import "vue3-carousel/carousel.css";
import { Carousel, Slide, Pagination, Navigation } from "vue3-carousel";
import { useEasyLightbox } from "vue-easy-lightbox";

const screenshotData = ref([
  {
    src: "/screenshots/teskooano-ui-1.png",
    alt: "Teskooano UI Close-up",
    caption:
      "Close-up view of a planet with simulation controls and celestial body information panel.",
  },
  {
    src: "/screenshots/teskooano-ui-2.png",
    alt: "Teskooano UI Wide View",
    caption: "Wider view showing multiple celestial bodies and orbital paths.",
  },
  // Add more screenshots here if needed
  // { src: '/screenshots/teskooano-ui-3.png', alt: 'Another view', caption: 'Description of another view.' },
]);

// Prepare image sources for the lightbox
const lightboxImgs = computed(() => screenshotData.value.map((s) => s.src));

// Use the composable for lightbox state
const {
  // methods
  show: showLightbox,
  onHide,
  // refs
  visibleRef,
  indexRef,
  imgsRef,
} = useEasyLightbox({
  imgs: lightboxImgs.value, // Pass computed image sources
  initIndex: 0,
});

// Function to show lightbox for a specific image index
const openLightbox = (index) => {
  imgsRef.value = lightboxImgs.value; // Ensure imgsRef is up to date
  indexRef.value = index; // Set the index of the clicked image
  showLightbox(); // Show the lightbox
};

const carouselConfig = ref({
  itemsToShow: 1, // Show 1 full item and half of the next
  wrapAround: true, // Loop the carousel
  snapAlign: "center", // Center the active slide
});
</script>

<template>
  <div class="screenshot-carousel-container">
    <Carousel v-bind="carouselConfig">
      <Slide v-for="(screenshot, index) in screenshotData" :key="index">
        <div class="carousel__item">
          <img
            :src="screenshot.src"
            :alt="screenshot.alt"
            class="carousel-img"
            @click="openLightbox(index)"
          />
          <p class="carousel-caption">{{ screenshot.caption }}</p>
        </div>
      </Slide>

      <template #addons>
        <Navigation />
        <Pagination />
      </template>
    </Carousel>

    <vue-easy-lightbox
      :visible="visibleRef"
      :imgs="imgsRef"
      :index="indexRef"
      @hide="onHide"
    />
  </div>
</template>

<style>
.screenshot-carousel-container {
  margin: 3rem 0;
}

.carousel__item {
  min-height: 200px;
  width: 100%;
  background-color: rgba(10, 20, 40, 0.7); /* Match content background */
  color: var(--vp-c-text);
  font-size: 14px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start; /* Align content to top */
  align-items: center;
  padding: 1rem;
  box-shadow: 0 0 15px rgba(49, 122, 122, 0.1);
  margin: 0 0.5rem; /* Add space between slides */
  overflow: hidden;
}

.carousel-img {
  width: 100%;
  height: auto;
  max-height: 300px; /* Limit image height */
  object-fit: cover; /* Cover the area, might crop */
  border-radius: 4px;
  margin-bottom: 1rem;
  cursor: pointer;
}

.carousel-caption {
  font-style: italic;
  text-align: center;
  margin: 0;
  font-size: 0.9em;
  line-height: 1.4;
}

/* Carousel Navigation Buttons */
.carousel__prev,
.carousel__next {
  box-sizing: content-box;
  background-color: rgba(96, 81, 156, 0.5); /* Use nebula purple */
  border-radius: 50%;
  width: 30px;
  height: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  transition: background-color 0.3s;
}

.carousel__prev:hover,
.carousel__next:hover {
  background-color: rgba(96, 81, 156, 0.8);
}

.carousel__icon {
  fill: currentColor;
  width: 16px;
  height: 16px;
}

/* Carousel Pagination */
.carousel__pagination {
  padding: 10px;
}

.carousel__pagination-button {
  display: block;
  cursor: pointer;
  border: 0;
  background-color: rgba(255, 255, 255, 0.2);
  width: 10px;
  height: 10px;
  padding: 0;
  border-radius: 50%;
  margin: 0 5px;
  transition: background-color 0.3s;
}

.carousel__pagination-button:hover {
  background-color: rgba(255, 255, 255, 0.4);
}

.carousel__pagination-button--active {
  background-color: var(--nebula-purple); /* Active dot color */
}

/* You might need to adjust z-index if the lightbox appears behind other elements */
.vue-easy-lightbox {
  z-index: 1001; /* Example: Ensure it's above other elements */
}
</style>
