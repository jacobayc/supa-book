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

const authStore = useAuthStore();
const isMenuOpen = ref(false);
const isChange = ref(false);
const newNickname = ref('');

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
};

const openProfileModal = () => {
  isChange.value = true;
  isMenuOpen.value = false;
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
  padding: 20px;
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
  padding-bottom: 10px;
}

.modal-header h2 {
  font-size: 20px;
}

.close-btn {
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
  margin: 5px 0;
}

.nickname-section {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
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
</style>