<template>
  <button @click="$emit('click')" class="action-btn change-file-btn">
    <img src="@/assets/icons/file-search.svg" alt="Change File" class="action-icon">
    <span>Change File</span>
  </button>
</template>

<script>
export default {
  name: 'ButtonChangeFile',
  emits: ['click']
}
</script>

<style scoped>
.action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;
  border: 2px solid #e9ecef;
  color: #2c3e50;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.change-file-btn:hover {
  border-color: #ff6b35;
  color: #ff6b35;
}

.action-icon {
  width: 18px;
  height: 18px;
  transition: transform 0.2s ease;
  filter: brightness(0) saturate(100%) invert(30%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(1) contrast(1);
}

.change-file-btn:hover .action-icon {
  filter: brightness(0) saturate(100%) invert(40%) sepia(100%) saturate(2000%) hue-rotate(15deg) brightness(1) contrast(1);
}

.action-btn:hover .action-icon {
  transform: scale(1.1);
}

.action-btn span {
  white-space: nowrap;
}

/* Responsive design */
@media (max-width: 768px) {
  .action-btn {
    justify-content: center;
    padding: 12px 16px;
  }
}
</style>
