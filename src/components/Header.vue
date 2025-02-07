// TheHeader.vue
<template>
  <header class="header">
    <div class="header-content">
      <div class="logo">
        <Vue3Lottie 
          :animationData="animationJSON"
          :height="50"
          :speed= ".5"
        />
      </div>
      <div class="hamburger" @click="toggleMenu">
        <div class="bar"></div>
        <div class="bar"></div>
        <div class="bar"></div>
      </div>
      <nav v-if="isMenuOpen" class="menu">
        <button @click="openProfileModal" class="logout-button">회원정보 변경</button>
        <button @click="logout" class="logout-button">로그아웃</button>
      </nav>
    </div>

    <!-- 모달 -->
    <div v-if="isChange" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h2>프로필 정보</h2>
          <!-- 프로필 이미지 섹션 추가 -->
          <div class="profile-image-section"  @click="triggerFileInput">
            <img 
              :src="profileImageUrl" 
              alt="no-icon" 
              @error="handleError"
              class="profile-image"
            />
            <input 
              type="file"
              ref="fileInput"
              @change="handleImageUpload"
              accept="image/*"
              style="display: none"
            />
        </div>
          <button @click="closeProfileModal" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <div class="profile-info">
            <p><strong>아이디 : </strong> {{ authStore.user.email }}</p>
            <p><strong>이름 : </strong> {{ authStore.user.name }}</p>
            <div class="nickname-section">
              <p><strong>닉네임 : </strong></p>
              <input 
                type="text" 
                v-model="newNickname" 
                :placeholder="authStore.user.nickname || '닉네임 입력'"
              />
              <button @click="updateNickname" class="update-btn">변경</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref } from 'vue';
import { useAuthStore } from '../stores/auth';
import emitter from '../utils/eventBus'
import { Vue3Lottie } from 'vue3-lottie'
import animationJSON from '@/assets/logo.json'
import avatar_default from '@/assets/avatar_default.png'

const authStore = useAuthStore();
const isMenuOpen = ref(false);
const isChange = ref(false);
const newNickname = ref('');
const fileInput = ref(null);
const profileImageUrl = ref(authStore.user?.avatar_url);

const handleError = (event) => {
  event.target.src = avatar_default;
}

const triggerFileInput = () => {
  fileInput.value.click();
};

const handleImageUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  try {
    const url = await authStore.uploadProfileImage(file);
    profileImageUrl.value = url;
    alert('프로필 이미지가 업데이트되었습니다.');
    emitter.emit('avatar-updated')
  } catch (error) {
    alert('이미지 업로드에 실패했습니다.');
  }
};

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
};

const openProfileModal = () => {
  isChange.value = true;
  isMenuOpen.value = false;
  authStore.checkSession()
  // 현재 닉네임을 초기값으로 설정
  newNickname.value = authStore.user.nickname || '';
};

const closeProfileModal = () => {
  isChange.value = false;
  newNickname.value = '';
};

const updateNickname = async () => {
  if (!newNickname.value.trim()) {
    alert('닉네임을 입력해주세요.');
    return;
  }

  try {
    await authStore.updateUserNickname(newNickname.value.trim());
  
    // 세션 갱신 이벤트 발행
    emitter.emit('session-updated')
    closeProfileModal();
  } catch (error) {
    console.error('닉네임 변경 실패', error);
  }
};

const logout = async () => {
  await authStore.logout();
  isMenuOpen.value = false; // 로그아웃 후 메뉴 닫기
};

</script>

<style scoped>
.header {
  background-color: #343434;
  padding: 0px 10px;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 100;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-content {
  position: relative;
  display: flex;
  justify-content: space-between; /* 로고와 햄버거 버튼 사이 간격 유지 */
  align-items: center;
  max-width: 1680px;
  margin: 0 auto;
}

.logo {
  width:50px;
}

.logo img {
  width:100%;
}

.hamburger {
  display: flex; /* 항상 표시 */
  flex-direction: column;
  cursor: pointer;
  padding: 10px;
  margin-left: auto; /* 우측 정렬 */
}

.bar {
  width: 25px;
  height: 3px;
  background-color: #ccc;
  margin: 3px 0;
  transition: 0.4s;
}

.menu {
  width: 25vw;
  max-width: 200px;
  display: flex;
  flex-direction: column;
  position: absolute;
  top: 55px;
  right: 0;
  background-color: #fff;
  border: 1px solid #ddd;
  border-top: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 101;
  outline: 1px solid red;
}

.menu .logout-button {
  display: block;
  width: 100%;
  padding: 10px;
  text-align: center;
  background: none;
  border: none;
  cursor: pointer;
  border-bottom: 1px solid #eee;
}

.menu .logout-button:last-child {
  border-bottom: none;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: #222;
  padding: 10px 40px;
  border-radius: 8px;
  width: 90%;
  max-width: 400px;
  max-height: 80%;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #222;
  padding-bottom: 40px;
}

.modal-header h2 {
  font-size: 20px;
  transform: translateY(-25px);
}

.close-btn {
  transform: translateY(-35px);
  background: none;
  border: none;
  font-size: 32px;
  cursor: pointer;
  color: #2faacc;
}

.profile-info {
  margin-top: 15px;
}

.profile-info p {
  margin: 10px 0;
}

.nickname-section {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: -10px;
}

.nickname-section input {
  width:100%;
  max-width: 180px;
  flex-grow: 1;
  padding: 8px;
  border-radius: 4px;
  height: 24px;
  border: none;
  outline: none;
}

.update-btn {
  height: 24px;
  line-height: 10px;
  letter-spacing: -1px;
  padding: 8px 15px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.profile-image-section {
  height: 90px;
  transform:translate(-140px, 50px);
  margin: 10px 0;
  text-align: center;
}

.profile-image-section::after {
  display: block;
  content: "프로필 변경";
  letter-spacing: -2px;
  transform:translateY(-40px);
  /* width: 100px; */
  /* height: 30px; */
  color: #059e7a;
}

.profile-image {
  display:inline-block;
  width: 90px;
  height: 90px;
  border-radius: 100%;
  object-fit: cover;
  cursor: pointer;
  border: 1px solid #2faacc;
  transition: transform 0.2s;
}

.profile-image:hover {
  transform: scale(1.05);
}
</style>