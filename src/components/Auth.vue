<template>
  <div class="auth-container">
    <!-- Thông báo lỗi -->
    <div v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </div>

    <!-- Thông báo thành công -->
    <div v-if="successMessage" class="success-message">
      {{ successMessage }}
    </div>

    <!-- Hello World sau khi login -->
    <div v-if="isLoggedIn">
      <h1>Login thành công!</h1>
    </div>

    <!-- Login Form -->
    <form v-if="!isLoggedIn" @submit.prevent="handleLogin" class="auth-form">
      <h2>Đăng nhập</h2>
      <div class="form-group">
        <input 
          v-model="email" 
          type="email" 
          placeholder="Email"
          required
          :disabled="isLoading"
        >
      </div>
      <div class="form-group">
        <input 
          v-model="password" 
          type="password" 
          placeholder="Mật khẩu"
          required
          :disabled="isLoading"
        >
      </div>
      <button type="submit" :disabled="isLoading">
        {{ isLoading ? 'Đang xử lý...' : 'Đăng nhập' }}
      </button>
    </form>

    <!-- OTP Modal -->
    <div v-if="showOtpModal" class="modal">
      <div class="modal-content">
        <h2>Xác thực thiết bị mới</h2>
        <p class="modal-description">Vui lòng xác thực thiết bị này bằng mã OTP</p>
        
        <!-- OTP Status -->
        <div v-if="newDeviceOtpStatus" :class="['otp-status', newDeviceOtpStatus.type]">
          {{ newDeviceOtpStatus.message }}
        </div>

        <!-- Send OTP Section -->
        <div class="otp-section">
          <p class="email-info">Gửi mã xác thực đến: {{ email }}</p>
          <button 
            @click="handleSendOtp" 
            :disabled="isLoadingSendOtp"
            class="secondary-button"
          >
            {{ isLoadingSendOtp ? 'Đang gửi...' : 'Gửi lại mã OTP' }}
          </button>
        </div>

        <!-- Verify OTP Form -->
        <form @submit.prevent="handleVerifyOtp" class="verify-form">
          <div class="form-group">
            <label>Nhập mã OTP (6 số)</label>
            <input 
              v-model="newDeviceOtp" 
              type="text"
              pattern="\d{6}"
              maxlength="6"
              placeholder="Nhập 6 số"
              required
              :disabled="isLoadingVerify"
            >
          </div>
          <div class="modal-actions">
            <button 
              type="button" 
              @click="closeOtpModal" 
              class="secondary-button"
              :disabled="isLoadingVerify"
            >
              Hủy
            </button>
            <button 
              type="submit" 
              :disabled="isLoadingVerify || newDeviceOtp.length !== 6"
            >
              {{ isLoadingVerify ? 'Đang xác thực...' : 'Xác thực' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Device List Modal -->
    <div v-if="showDeviceListModal" class="modal">
      <div class="modal-content device-modal">
        <h2>Đã đạt giới hạn thiết bị</h2>
        <div class="limit-notice">
          <div class="notice-icon">
            <i class="fas fa-exclamation-circle"></i>
          </div>
          <p>Bạn chỉ có thể kích hoạt tối đa 3 thiết bị cùng lúc.</p>
          <p>Vui lòng gỡ bỏ ít nhất một thiết bị để tiếp tục đăng nhập.</p>
        </div>

        <!-- Device List -->
        <div class="device-list">
          <label 
            v-for="device in activeDevices" 
            :key="device.id" 
            class="device-item"
            :class="{ 'selected': selectedDevices.includes(device.device_token) }"
          >
            <div class="checkbox-container">
              <input 
                type="checkbox" 
                :value="device.device_token"
                v-model="selectedDevices"
              >
              <span class="checkmark"></span>
            </div>
            <div class="device-details">
              <div class="device-name">{{ device.name }}</div>
              <div class="device-time">Đăng nhập cuối: {{ formatDate(device.last_login_at) }}</div>
            </div>
          </label>
        </div>
        
        <div v-if="selectedDevices.length > 0" class="selected-count">
          Đã chọn {{ selectedDevices.length }} thiết bị
        </div>

        <!-- OTP Section -->
        <div v-if="selectedDevices.length > 0" class="otp-section">
          <div v-if="deviceListOtpStatus" :class="['otp-status', deviceListOtpStatus.type]">
            {{ deviceListOtpStatus.message }}
          </div>

          <p class="email-info">
            <span class="email-label">Gửi mã xác thực đến:</span>
            <span class="email-value">{{ email }}</span>
          </p>
          
          <button 
            @click="handleSendOtp(2)" 
            :disabled="selectedDevices.length === 0 || isLoadingSendOtp"
            :class="['otp-button', selectedDevices.length > 0 ? 'active' : 'disabled']"
          >
            {{ isLoadingSendOtp ? 'Đang gửi...' : 'Gửi mã OTP' }}
          </button>

          <!-- Verify Form -->
          <form v-if="showDeviceListOtpInput" @submit.prevent="handleRemoveDevices" class="verify-form">
            <div class="form-group">
              <input 
                v-model="deviceListOtp" 
                type="text"
                pattern="\d{6}"
                maxlength="6"
                placeholder="Nhập mã OTP (6 số)"
                required
                :disabled="isLoadingVerify"
              >
            </div>
            <div class="modal-actions">
              <button 
                type="button" 
                @click="closeDeviceListModal" 
                class="secondary-button"
                :disabled="isLoadingVerify"
              >
                Hủy
              </button>
              <button 
                type="submit" 
                :disabled="isLoadingVerify || deviceListOtp.length !== 6"
                class="primary-button"
              >
                {{ isLoadingVerify ? 'Đang xác thực...' : 'Xác nhận gỡ bỏ' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axiosInstance from '@/plugins/axios'
import { DeviceService } from '@/services/device'
import { useRouter } from 'vue-router'

const email = ref('')
const password = ref('')
const otp = ref('')
const currentStep = ref('login')
const deviceInfo = ref(null)
const deviceToken = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const showOtpModal = ref(false)
const isLoadingSendOtp = ref(false)
const isLoadingVerify = ref(false)
const successMessage = ref('')
const isLoggedIn = ref(false)
const showDeviceListModal = ref(false)
const selectedDevices = ref<string[]>([])
const showNewDeviceOtpInput = ref(false)
const activeDevices = ref([])

// Tách riêng các biến cho modal new device
const newDeviceOtpStatus = ref<{ type: 'success' | 'error', message: string } | null>(null)

// Tách riêng các biến cho modal device list
const deviceListOtpStatus = ref<{ type: 'success' | 'error', message: string } | null>(null)
const showDeviceListOtpInput = ref(false)

// Tách biến otp thành hai biến riêng
const newDeviceOtp = ref('')
const deviceListOtp = ref('')

const router = useRouter()

// Lấy thông tin device khi component được tạo
onMounted(async () => {
  deviceInfo.value = await DeviceService.getDeviceInfo()
})

// Helper để reset error message
const clearError = () => {
  errorMessage.value = ''
}

const closeOtpModal = () => {
  showOtpModal.value = false
  newDeviceOtp.value = ''
  newDeviceOtpStatus.value = null
  showNewDeviceOtpInput.value = false
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('vi-VN')
}

const fetchActiveDevices = async (deviceToken: string) => {
  try {
    const response = await axiosInstance.get(`/api/v1/active-devices?device_token=${deviceToken}`)
    if (response.data.success) {
      activeDevices.value = response.data.data
    }
  } catch (error) {
    errorMessage.value = 'Không thể tải danh sách thiết bị'
  }
}

const handleLogin = async () => {
  try {
    clearError()
    isLoading.value = true
    
    const formData = new FormData()
    formData.append('email', email.value)
    formData.append('password', password.value)
    formData.append('device_name', deviceInfo.value.device_name)
    formData.append('finger_print', deviceInfo.value.device_id)

    const response = await axiosInstance.post('/api/v1/login', formData)

    if (response.data.success) {
      if (response.data.token) {
        localStorage.setItem('token', response.data.token)
        isLoggedIn.value = true
      }
    }
  } catch (error) {
    if (error.response?.data?.status === 'DEVICE_LIMIT_EXCEEDED') {
      await fetchActiveDevices(error.response.data.device_token)
      deviceToken.value = error.response.data.device_token
      showDeviceListModal.value = true
      return
    }

    if (error.response?.status === 400 && error.response?.data?.status === 'NEW_DEVICE') {
      deviceToken.value = error.response.data.device_token
      errorMessage.value = 'Phát hiện thiết bị mới, vui lòng xác thực.'
      setTimeout(() => {
        showOtpModal.value = true
        handleSendOtp()
      }, 1000)
      return
    }

    errorMessage.value = error.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại.'
  } finally {
    isLoading.value = false
  }
}

const handleSendOtp = async (purpose = 1) => {
  try {
    isLoadingSendOtp.value = true
    if (purpose === 1) {
      newDeviceOtpStatus.value = null
    } else {
      deviceListOtpStatus.value = null
    }

    const formData = new FormData()
    formData.append('email', email.value)
    formData.append('otp_purpose', purpose.toString())
    formData.append('send_type', '1')
    formData.append('device_token', deviceToken.value)

    await axiosInstance.post('/api/v1/send-otp', formData)
    
    setTimeout(() => {
      if (purpose === 1) {
        newDeviceOtpStatus.value = {
          type: 'success',
          message: 'Mã OTP đã được gửi thành công!'
        }
        showNewDeviceOtpInput.value = true
      } else {
        deviceListOtpStatus.value = {
          type: 'success',
          message: 'Mã OTP đã được gửi thành công!'
        }
        showDeviceListOtpInput.value = true
      }
    }, 500)
  } catch (error) {
    setTimeout(() => {
      const errorMessage = error.response?.data?.message === 'Too many requests' 
        ? 'Bạn đã yêu cầu OTP quá nhiều lần. Vui lòng thử lại sau 1 giờ.'
        : error.response?.data?.message || 'Không thể gửi mã OTP. Vui lòng thử lại.'
      
      if (purpose === 1) {
        newDeviceOtpStatus.value = { type: 'error', message: errorMessage }
      } else {
        deviceListOtpStatus.value = { type: 'error', message: errorMessage }
      }
    }, 500)
  } finally {
    isLoadingSendOtp.value = false
  }
}

const handleVerifyOtp = async () => {
  try {
    isLoadingVerify.value = true
    errorMessage.value = ''

    const formData = new FormData()
    formData.append('otp_code', newDeviceOtp.value)
    formData.append('device_token', deviceToken.value)

    const verifyResponse = await axiosInstance.post('/api/v1/verify-new-device', formData)
    
    if (verifyResponse.data.success) {
      newDeviceOtp.value = '' // Clear OTP khi verify thành công
      
      // Sau khi verify thành công, gọi lại API login
      const loginFormData = new FormData()
      loginFormData.append('email', email.value)
      loginFormData.append('password', password.value)
      loginFormData.append('device_name', deviceInfo.value.device_name)
      loginFormData.append('finger_print', deviceInfo.value.device_id)

      try {
        const loginResponse = await axiosInstance.post('/api/v1/login', loginFormData)

        if (loginResponse.data.success) {
          if (loginResponse.data.token) {
            localStorage.setItem('token', loginResponse.data.token)
          }
          successMessage.value = 'Xác thực thiết bị thành công!'
          showOtpModal.value = false
          isLoggedIn.value = true
        }
      } catch (loginError) {
        // Xử lý trường hợp DEVICE_LIMIT_EXCEEDED sau khi xác thực thiết bị mới
        if (loginError.response?.data?.status === 'DEVICE_LIMIT_EXCEEDED') {
          await fetchActiveDevices(loginError.response.data.device_token)
          deviceToken.value = loginError.response.data.device_token
          showOtpModal.value = false // Đóng modal xác thực thiết bị mới
          showDeviceListModal.value = true // Mở modal quản lý devices
          return
        }
        throw loginError
      }
    }
  } catch (error) {
    newDeviceOtpStatus.value = {
      type: 'error',
      message: error.response?.data?.message === 'Invalid OTP'
        ? 'Mã OTP không chính xác. Vui lòng kiểm tra lại.'
        : error.response?.data?.message || 'Xác thực OTP thất bại. Vui lòng thử lại.'
    }
  } finally {
    isLoadingVerify.value = false
  }
}

const closeDeviceListModal = () => {
  showDeviceListModal.value = false
  selectedDevices.value = []
  showDeviceListOtpInput.value = false
  deviceListOtpStatus.value = null
  deviceListOtp.value = ''
}

const handleRemoveDevices = async () => {
  try {
    isLoadingVerify.value = true
    errorMessage.value = ''

    const formData = new FormData()
    formData.append('otp_code', deviceListOtp.value)
    formData.append('device_token', deviceToken.value)
    
    selectedDevices.value.forEach(token => {
      formData.append('remove_device_tokens[]', token)
    })

    const response = await axiosInstance.post('/api/v1/verify-remove-device', formData)
    
    if (response.data.success) {
      deviceListOtp.value = '' // Clear OTP khi verify thành công
      closeDeviceListModal()
      handleLogin()
    }
  } catch (error) {
    deviceListOtpStatus.value = {
      type: 'error',
      message: error.response?.data?.message === 'Invalid OTP'
        ? 'Mã OTP không chính xác. Vui lòng kiểm tra lại.'
        : error.response?.data?.message || 'Xác thực OTP thất bại. Vui lòng thử lại.'
    }
  } finally {
    isLoadingVerify.value = false
  }
}
</script>

<style scoped>
.auth-container {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.auth-form {
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 30px;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.form-group {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.2s ease;
}

input:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.1);
}

button {
  width: 100%;
  padding: 12px 24px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: background-color 0.2s ease;
}

button:hover {
  background-color: #45a049;
}

.error-message {
  padding: 10px;
  margin-bottom: 15px;
  background-color: #ffebee;
  color: #c62828;
  border-radius: 4px;
  text-align: center;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 30px;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  border: 1px solid #e0e0e0;
}

.modal-description {
  margin: 20px 0;
  color: #666;
  text-align: center;
}

.email-info {
  text-align: center;
  color: #666;
  margin: 15px 0;
}

.verify-form {
  margin-top: 25px;
}

.verify-form label {
  display: block;
  margin-bottom: 8px;
  color: #666;
}

.verify-form input {
  text-align: center;
  letter-spacing: 8px;
  font-size: 20px;
  font-weight: 500;
}

.otp-section {
  margin: 25px 0;
  text-align: center;
}

.modal-actions {
  display: flex;
  gap: 15px;
  justify-content: space-between;
  margin-top: 25px;
}

.modal-actions button {
  flex: 1;
  min-width: 120px;
}

.otp-status {
  padding: 12px;
  margin: 15px 0;
  border-radius: 8px;
  text-align: center;
}

.otp-status.error {
  background-color: #ffebee;
  color: #d32f2f; /* Màu đỏ đậm hơn */
  border: 1px solid #ffcdd2;
}

.otp-status.success {
  background-color: #e8f5e9;
  color: #2e7d32;
  border: 1px solid #c8e6c9;
}

.secondary-button {
  background-color: #9e9e9e;
}

.secondary-button:hover {
  background-color: #757575;
}

.success-message {
  padding: 10px;
  margin-bottom: 15px;
  background-color: #e8f5e9;
  color: #2e7d32;
  border-radius: 4px;
  text-align: center;
}

h1 {
  text-align: center;
  color: #333;
  font-size: 4rem;
  margin: 20px 0;
  font-weight: bold;
  width: 100%;
}

.device-modal {
  width: 100%;
  max-width: 400px;
  padding: 24px;
}

.device-list {
  margin: 20px 0;
}

.device-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  margin-bottom: 8px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.device-item:hover {
  border-color: #4CAF50;
  background-color: #f8fdf8;
}

.device-item.selected {
  border-color: #4CAF50;
  background-color: #f1f8f1;
}

/* Custom checkbox */
.checkbox-container {
  position: relative;
  display: flex;
  align-items: center;
  padding-right: 12px;
}

.checkbox-container input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

.checkmark {
  position: relative;
  height: 18px;
  width: 18px;
  border: 2px solid #bdbdbd;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.checkbox-container input:checked ~ .checkmark {
  background-color: #4CAF50;
  border-color: #4CAF50;
}

.checkmark:after {
  content: "";
  position: absolute;
  display: none;
  left: 5px;
  top: 1px;
  width: 4px;
  height: 9px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.checkbox-container input:checked ~ .checkmark:after {
  display: block;
}

.selected-count {
  text-align: center;
  color: #4CAF50;
  font-weight: 500;
  font-size: 14px;
  margin: 16px 0;
}

.device-details {
  flex: 1;
  margin-left: 8px;
}

.device-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.device-time {
  font-size: 12px;
  color: #666;
}

/* Modal title and description */
.device-modal h2 {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.modal-description {
  font-size: 14px;
  color: #666;
  text-align: center;
  margin-bottom: 16px;
}

.otp-button {
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  border: none;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.otp-button.active {
  background-color: #4CAF50;
  color: white;
}

.otp-button.active:hover {
  background-color: #45a049;
}

.otp-button.disabled {
  background-color: #e0e0e0;
  color: #757575;
  cursor: not-allowed;
}

/* Thêm style cho trạng thái cooldown */
.otp-button:disabled:not(.disabled) {
  background-color: #4CAF50;
  opacity: 0.7;
  cursor: not-allowed;
}

.limit-notice {
  background-color: #fff3e0;
  border: 1px solid #ffe0b2;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
  text-align: center;
}

.notice-icon {
  color: #f57c00;
  font-size: 24px;
  margin-bottom: 12px;
}

.limit-notice p {
  color: #e65100;
  font-size: 14px;
  line-height: 1.5;
  margin: 0;
}

.limit-notice p:first-of-type {
  font-weight: 500;
  margin-bottom: 4px;
}
</style> 