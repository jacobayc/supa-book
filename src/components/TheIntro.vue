<template>
  <div class="container">
    <div class="tab-container">
      <button :class="{ active: isLoginFormVisible }" @click="showLoginForm">로그인</button>
      <button :class="{ active: !isLoginFormVisible }" @click="showSignUpForm">회원가입</button>
    </div>

    <div class="form-container">
      <div v-if="isLoginFormVisible">
        <input type="email" v-model="email" placeholder="이메일" class="input-field" />
        <input type="password" v-model="password" placeholder="비밀번호" class="input-field" />
        <button @click="signIn" class="submit-button">로그인</button>
      </div>
      <div v-else>
        <input type="email" v-model="email" placeholder="이메일" class="input-field" />
        <input type="password" v-model="password" placeholder="비밀번호" class="input-field" />
        <input type="text" v-model="name" placeholder="이름" class="input-field" />
        <input type="text" v-model="nickname" placeholder="닉네임" class="input-field" />
        <button @click="signUp" class="submit-button">가입하기</button>
      </div>
    </div>
    <div class="welcome-message">
        <h1>
          
        </h1>
    </div>
    <div v-if="error" class="error-message">
      {{ error }}
    </div>
    <div class="main-bg"></div>
    <div class="gradient"></div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();
const email = ref('');
const password = ref('');
const name = ref('');
const nickname = ref('');
const error = ref(null);
const isLoginFormVisible = ref(true); // 로그인 폼이 기본으로 보이도록 설정

const showLoginForm = () => {
    isLoginFormVisible.value = true;
};

const showSignUpForm = () => {
    isLoginFormVisible.value = false;
};

const signIn = async () => {
  error.value = null;
  try {
    await authStore.signInWithEmail(email.value, password.value);
    router.push('/');
  } catch (err) {
    console.error('로그인에 실패했습니다. :', err);
    error.value = err.message;
  }
};

const signUp = async () => {
  error.value = null;
  try {
    await authStore.signUpWithEmail(email.value, password.value, name.value, nickname.value);
    alert("인증 메일이 발송되었습니다. 메일함을 확인해주세요");
  } catch (err) {
    console.error('회원가입 오류:', err);
    error.value = err.message;
  }
};
</script>

<style scoped>
.container {
  width: 100%;
  max-width: 1920px;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 300px;
  position: relative; /* 탭 컨테이너의 기준 위치 설정 */
}

.tab-container {
  display: flex;
  position: fixed; /* 절대 위치 설정 */
  z-index: 9999;
  top: 20px; /* 상단 여백 */
  right: 10px; /* 우측 여백 */
}

button {
  padding: 8px 10px;
  border: none;
  cursor: pointer;
  font-size: 12px;
  margin: 0 5px;
  border-radius: 5px;
  transition: background-color 0.3s ease; /* 부드러운 전환 효과 */
}

button.active {
  background-image: linear-gradient(to right, #800080, #FF69B4); /* 보라색에서 분홍색 그라데이션 */
  color: white;
  font-weight: bold;
}

.form-container {
  z-index: 9999;
  transform: translateY(250px);
  position: relative;
  min-height: 250px;
  display: flex;
  flex-direction: column;
  width: 300px; /* 폼 너비 조정 */
}

.form-container >div {
  height: auto;
}

.welcome-message {
  width: 100%;
  max-width: 1200px;
  position: absolute;
  top: 100px;
  left: 50%;
  transform:translateX(-50%);
  text-align: center;
}

.input-field {
  width: 100%;
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 16px;
  box-sizing: border-box; /* padding, border 포함하여 너비 계산 */
}

.submit-button {
  width: 100%;
  margin: 0 auto;
  background-image: linear-gradient(to right, #800080, #FF69B4); /* 제출 버튼 그라데이션 */
  color: white;
  padding: 12px;
  border: none;
  border-radius: 5px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s ease; /* 부드러운 전환 효과 */
}

.submit-button:hover {
  filter: brightness(1.1);
}

.error-message {
  color: red;
  margin-top: 10px;
}

.main-bg {
  width: 100%;
  height: 100vh;
  z-index:1;
  position: absolute;
  left:0;
  top:0;
  background-image: url('@/assets/nature.jpg');
  background-repeat: no-repeat; 
  background-position: center;
}


.gradient {
  width: 100%;
  height: 100vh;
  z-index:10;
  position: absolute;
  left:0;
  top:0;
  background-image: url('@/assets/gradient.png');
  background-repeat: no-repeat; 
}
</style>