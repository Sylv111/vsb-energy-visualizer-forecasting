<template>
  <div v-if="show" class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>🔔 Notifications</h2>
        <button @click="closeModal" class="close-btn">&times;</button>
      </div>
      
      <div class="modal-body">
        <!-- Notification List -->
        <div class="notifications-list">
          <!-- Empty state message -->
          <div v-if="processedNotifications.length === 0" class="empty-state">
            <div class="empty-icon">📭</div>
            <h3>No notifications yet</h3>
            <p>AI training progress and completion notifications will appear here.</p>
          </div>
          
          <!-- Notifications -->
          <div 
            v-for="notification in processedNotifications" 
            :key="notification.id"
            class="notification-item"
            :class="{ 'complete': notification.isComplete }"
          >
            <div class="notification-header">
              <h3>{{ notification.title }}</h3>
            </div>
            <div class="notification-progress">
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: notification.progress + '%' }"></div>
              </div>
              <span class="progress-text">{{ notification.progress }}% Complete</span>
            </div>
            <div class="notification-description">
              <p>{{ notification.description }}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div class="modal-footer">
        <button @click="closeModal" class="btn btn-secondary">Close</button>
      </div>
    </div>
  </div>
</template>

<script>
import sseService from '@/services/sseService'

export default {
  name: 'ModalNotification',
  props: {
    show: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close'],
  data() {
    return {
      notifications: []
    }
  },
  computed: {
    processedNotifications() {
      return this.notifications.map(notification => {
        // Calculate percentage based on epochs
        let progress = notification.progress
        if (notification.totalEpochs > 0) {
          progress = Math.round((notification.currentEpoch / notification.totalEpochs) * 100)
        }
        
        const isComplete = progress >= 100
        return {
          ...notification,
          progress: progress,
          title: isComplete ? 'AI Training Complete' : 'AI Training in Progress',
          description: isComplete 
            ? `Your CSV file "${notification.fileName}" has been successfully processed and is ready for visualization.`
            : `Training ConvLSTM model on "${notification.fileName}". Epoch ${notification.currentEpoch}/${notification.totalEpochs}...`
        }
      })
    }
  },
  mounted() {
    sseService.connect()
    sseService.on('progress', this.handleProgress)
    sseService.on('completed', this.handleCompleted)
    sseService.on('error', this.handleError)
    sseService.on('connected', this.handleConnected)
  },
  beforeUnmount() {
    sseService.off('progress', this.handleProgress)
    sseService.off('completed', this.handleCompleted)
    sseService.off('error', this.handleError)
    sseService.off('connected', this.handleConnected)
  },
  methods: {
    closeModal() {
      this.$emit('close')
    },
    
    handleConnected() {
    },
    
    handleProgress(data) {
      if (!data || !data.fileName) {
        console.warn('Modal: Invalid progress data received:', data)
        return
      }
      
      // Find existing notification for this file
      let notification = this.notifications.find(n => n.fileName === data.fileName)
      
      if (!notification) {
        // Create new notification
        notification = {
          id: this.notifications.length + 1,
          fileName: data.fileName,
          currentEpoch: data.currentEpoch || 0,
          totalEpochs: data.totalEpochs || 0,
          progress: data.progress || 0,
          isComplete: false
        }
        this.notifications.unshift(notification) // Add to beginning
      } else {
        // Update progress
        notification.currentEpoch = data.currentEpoch || notification.currentEpoch
        notification.totalEpochs = data.totalEpochs || notification.totalEpochs
        notification.progress = data.progress || notification.progress
        notification.isComplete = (data.progress || 0) >= 100
      }
    },
    
    handleCompleted(data) {
      // Update notification to mark as complete
      const notification = this.notifications.find(n => n.fileName === data.fileName)
      if (notification) {
        notification.progress = 100
        notification.isComplete = true
      }
    },
    
    handleError(data) {
      
      // Mark notification as error
      const notification = this.notifications.find(n => n.fileName === data.fileName)
      if (notification) {
        notification.progress = -1 // -1 to indicate error
        notification.isComplete = false
        notification.hasError = true
        notification.error = data.error
      }
    },
    
    
    updateEpochProgress(notificationId, currentEpoch, totalEpochs) {
      const notification = this.notifications.find(n => n.id === notificationId)
      if (notification) {
        notification.currentEpoch = currentEpoch
        notification.totalEpochs = totalEpochs
        // Percentage will be automatically recalculated by the computed property
      }
    },
    
    // Method to simulate progress (to be removed in production)
    simulateTraining() {
      const notification = this.notifications[0]
      if (notification.totalEpochs > 0 && notification.currentEpoch < notification.totalEpochs) {
        notification.currentEpoch++
        // Simulate progress every 2 seconds
        setTimeout(() => {
          this.simulateTraining()
        }, 2000)
      }
    }
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 95%;
  max-width: 600px;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0,0,0,0.3);
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8f9fa;
}

.modal-header h2 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.3rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6c757d;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background-color: #e9ecef;
  color: #495057;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.notifications-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.notification-item {
  background: #f8f9fa;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  padding: 1.5rem;
  transition: all 0.2s ease;
}

.notification-item:hover {
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
}

.notification-item.complete {
  border-color: #28a745;
  background: #f8fff9;
}

.notification-item.complete .progress-fill {
  background: linear-gradient(90deg, #28a745 0%, #20c997 100%);
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.notification-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.1rem;
  font-weight: 600;
}

.notification-time {
  color: #7f8c8d;
  font-size: 0.9rem;
  font-weight: 500;
}

.notification-progress {
  margin-bottom: 1rem;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  color: #667eea;
  font-size: 0.9rem;
  font-weight: 600;
}

.notification-description {
  color: #6c757d;
  font-size: 0.95rem;
  line-height: 1.5;
}

.notification-description p {
  margin: 0;
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e9ecef;
  display: flex;
  justify-content: flex-end;
  background: #f8f9fa;
  border-radius: 0 0 12px 12px;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
  border: none;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
}

.btn-primary {
  background: #667eea;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-right: 1rem;
}

.btn-primary:hover {
  background: #5a6fd8;
}

@keyframes modalFadeIn {
  from { 
    opacity: 0; 
    transform: translateY(-20px); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
}

.modal-content {
  animation: modalFadeIn 0.3s ease-out;
}

/* Empty state styling */
.empty-state {
  text-align: center;
  padding: 3rem 2rem;
  color: #6c757d;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.6;
}

.empty-state h3 {
  margin: 0 0 0.5rem 0;
  color: #495057;
  font-size: 1.2rem;
  font-weight: 600;
}

.empty-state p {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.5;
}

/* Responsive design */
@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    margin: 1rem;
  }
  
  .notification-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .notification-time {
    align-self: flex-end;
  }
  
  .empty-state {
    padding: 2rem 1rem;
  }
}
</style>
