<template>
  <button class="plus-circle-button" @click="$emit('click')">
    <svg width="24" height="24" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <g transform="translate(-464.000000, -1087.000000)" fill="#4a5568">
          <path d="M480,1117 C472.268,1117 466,1110.73 466,1103 C466,1095.27 472.268,1089 480,1089 C487.732,1089 494,1095.27 494,1103 C494,1110.73 487.732,1117 480,1117 L480,1117 Z M480,1087 C471.163,1087 464,1094.16 464,1103 C464,1111.84 471.163,1119 480,1119 C488.837,1119 496,1111.84 496,1103 C496,1094.16 488.837,1087 480,1087 L480,1087 Z M486,1102 L481,1102 L481,1097 C481,1096.45 480.553,1096 480,1096 C479.447,1096 479,1096.45 479,1097 L479,1102 L474,1102 C473.447,1102 473,1102.45 473,1103 C473,1103.55 473.447,1104 474,1104 L479,1104 L479,1109 C479,1109.55 479.447,1110 480,1110 C480.553,1110 481,1109.55 481,1109 L481,1104 L486,1104 C486.553,1104 487,1103.55 487,1103 C487,1102.45 486.553,1102 486,1102 L486,1102 Z"></path>
        </g>
      </g>
    </svg>
    <span class="button-text">Add New Chart</span>
  </button>
</template>

<script>
export default {
  name: 'ButtonPlusCircle',
  emits: ['click']
}
</script>

<style scoped>
.plus-circle-button {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  font-weight: 500;
  color: #4a5568;
  min-width: 160px;
  justify-content: center;
}

.plus-circle-button:hover {
  border-color: #cbd5e0;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.plus-circle-button:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.plus-circle-button svg {
  flex-shrink: 0;
}

.button-text {
  font-size: 0.9rem;
  white-space: nowrap;
}

/* Responsive design */
@media (max-width: 640px) {
  .plus-circle-button {
    padding: 0.75rem 1rem;
    min-width: 140px;
  }
  
  .button-text {
    font-size: 0.8rem;
  }
}
</style>
