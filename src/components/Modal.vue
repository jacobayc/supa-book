

<template>
  <div v-if="open" class="modal">
    <strong style="color: hotpink;">{{isEditMode ? 'Edit mode' : ''}}</strong>
    <input type="text" v-model="title" :placeholder="initialTitle || title"/>
    <textarea v-model="text" :placeholder="initialText || text"/>
    <button @click="saveBook">{{isEditMode ? 'save' : 'save' }}</button>
    <button @click="closeModal">close</button>
  </div>
</template>

<script setup>

import { ref, watch } from 'vue';


const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  initialTitle: {
    type: String,
    default: ''
  },
  initialText: {
    type: String,
    default: ''
  },
  isEditMode: { 
    type: Boolean, 
    default: false 
  }
});

const title = ref('');
const text = ref('');

// 초기값 설정
watch(() => props.open, (newValue) => {
  if (newValue) {
    title.value = props.initialTitle
    text.value = props.initialText
  }
})


const emit = defineEmits(['close', 'save']);

const closeModal = () => {
  emit('close');
};

const saveBook = () => {
  // 제목과 내용이 비어있지 않은지 확인
  if (title.value.trim() && text.value.trim()) {
    emit('save', {
      title: title.value,
      text: text.value
    },
    props.isEditMode
    );
    
    // 저장 후 입력 필드 초기화
    title.value = '';
    text.value = '';
  } else {
    // 선택적: 유효성 검사 실패 시 알림
    alert('제목과 내용을 입력해주세요.');
  }
};
</script>

<style scoped>
.modal {
  width: 90vw !important;
  position: fixed; /* Make modal fixed on screen */
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%); /* Center the modal */
  background-color: #fff; /* White background */
  border: 1px solid #ddd; /* Light border */
  border-radius: 5px; /* Rounded corners */
  padding: 20px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1); /* Subtle shadow */
  width: 400px; /* Set modal width */

  /* Pink and purple gradient */
  background-image: linear-gradient(to right, #f7cac9, #e5b7b5);
}

.modal input,
.modal textarea,
.modal button {
  /* resize: none; */
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid #ddd;
  border-radius: 3px;
  width: 100%; /* Make inputs and buttons full width */
}
.modal textarea {
  height: 30vw;
}

@media (max-width: 1199px) {
  .modal {
  position: fixed; /* Make modal fixed on screen */
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%); /* Center the modal */
  background-color: #fff; /* White background */
  border: 1px solid #ddd; /* Light border */
  border-radius: 5px; /* Rounded corners */
  padding: 20px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1); /* Subtle shadow */
  width: 400px; /* Set modal width */

  /* Pink and purple gradient */
  background-image: linear-gradient(to right, #f7cac9, #e5b7b5);
}

.modal input,
.modal textarea,
.modal button {
  /* resize: none; */
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid #ddd;
  border-radius: 3px;
  width: 100%; /* Make inputs and buttons full width */
}
.modal textarea {
  height: 50vw;
}
}
</style>