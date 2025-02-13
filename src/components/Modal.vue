

<template>
  <div v-if="open" class="modal-container">
    <div class="editor-section">
      <strong style="color: lemonchiffon; font-size: 12px;">{{isEditMode ? '편집 중' : '작성 중'}}</strong>
      <input type="text" v-model="title" :placeholder="initialTitle || title"/>
      <textarea 
        v-model="text" 
        :placeholder="initialText || text"
        @scroll="syncScroll"
        ref="editorTextarea"
      />
      <div class="button-group">
        <button @click="closeModal">취소</button>
        <button @click="saveBook">{{isEditMode ? '수정' : '저장' }}</button>
      </div>
    </div>
    
    <div class="preview-section">
      <div class="preview-content" ref="previewContent">
        <h2 v-if="title">{{ title }}</h2>
        <div v-html="compiledContent"></div>
      </div>
    </div>
  </div>
</template>

<script setup>

import { ref, watch, computed } from 'vue';
import { marked } from 'marked';
import DOMPurify from 'dompurify';


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

// marked 설정 추가
marked.setOptions({
  breaks: true,      // 줄바꿈 허용
  gfm: true,         // GitHub Flavored Markdown 활성화
  headerIds: false,  // header에 자동 ID 생성 비활성화
  mangle: false      // 링크나 이메일 주소 수정 비활성화
});

// marked 색상 설정
marked.use({
  renderer: {
    text(text) {
      if (typeof text.text !== 'string') return text.text;
      
      try {
        // 색상과 배경색을 하나의 정규식으로 처리
        return text.text.replace(/(c|bc):(\w+)\s+(.*?)\./g, (match, type, color, content) => {
          if (type === 'c') {
            return `<span style="color:${color}">${content}</span>`;
          } else {
            return `<span style="background-color:${color}">${content}</span>`;
          }
        });
      } catch (error) {
        console.error('마크다운 변환 오류:', error);
        return text.text;
      }
    }
  }
});

// style 속성 허용
DOMPurify.setConfig({
  ALLOWED_TAGS: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'hr',
    'strong', 'em', 'del',
    'ul', 'ol', 'li',
    'blockquote', 'code', 'pre',
    'a', 'span'
  ],
  ALLOWED_ATTR: ['href', 'class', 'style']
});




const title = ref('');
const text = ref('');
const editorTextarea = ref(null);// 스크롤 동기화
const previewContent = ref(null);

// 마크다운 변환된 내용을 계산 computed
const compiledContent = computed(() => {
  if (!text.value) return '';
  return DOMPurify.sanitize(marked(text.value));
});


const syncScroll = (e) => {
  if (!previewContent.value) return;
  
  const textarea = e.target;
  const scrollPercentage = textarea.scrollTop / 
    (textarea.scrollHeight - textarea.clientHeight);
  
  const preview = previewContent.value;
  preview.scrollTop = scrollPercentage * 
    (preview.scrollHeight - preview.clientHeight);
};

// 초기값 설정
watch(() => props.open, (newValue) => {
  if (newValue) {
    title.value = props.initialTitle || '';
    text.value = props.initialText || '';
  }
});


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
.modal-container {
  width: 90vw;
  height: 90vh;
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  gap: 20px;
  padding: 20px;
  background-color: #222;
  border-radius: 5px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.editor-section, .preview-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.editor-section {
  position: relative;
  background-image: linear-gradient(to right, #3a3a3b, #282c2c);
  padding: 10px;
  border-radius: 5px;
}

.preview-section {
  font-size: 14px;
  background-color: #222;
  color: #fff;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 5px;
  overflow-y: auto;
  box-shadow: 5px 5px 10px rgba(150,150,150.2);
}

.preview-content {
  height: 100%;
  overflow-y: auto;
  padding: 5px;
  white-space: pre-wrap;
  word-break: break-all;
  line-height: 1.2;
}

.preview-content > h2 {
  font-size: 16px;
  color: salmon;
  margin-bottom: 30px;
}

/* 🟨 마크다운 스타일 추가 🟨 */
.preview-content :deep(h1),
.preview-content :deep(h2),
.preview-content :deep(h3),
.preview-content :deep(h4),
.preview-content :deep(h5),
.preview-content :deep(h6) {
  margin-bottom: 10px;
  font-weight: 600;
  line-height: 1;
}
.preview-content :deep(li) {
  line-height:1.2;
}
.preview-content :deep(code) {
  padding: 0.2em 0.4em;
  background-color: rgba(27,31,35,0.05);
  border-radius: 3px;
}
.preview-content :deep(pre) {
  padding: 16px;
  background-color: #f6f8fa;
  border-radius: 3px;
}
.preview-content :deep(blockquote) {
  padding: 0 1em;
  color: #adcae8;
  border-left: 0.25em solid #dfe2e5;
}

.modal-container input,
.modal-container textarea {
  width: 100%;
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid #ddd;
  color: #fff;
  border-radius: 3px;
  background-color: #222;
}

.modal-container textarea {
  height: calc(100% - 120px);
  resize: none;
}

.button-group {
  width: 90%;
  left: 50%;
  transform: translateX(-50%);
  position: absolute;
  bottom: 10px;
  display: flex;
  gap: 20px;
}

.button-group button {
  flex:1;
  padding: 10px;
  border: none;
  border-radius: 3px;
  cursor: pointer;
}

@media (max-width: 1199px) {
  .modal-container {
    flex-direction: column;
    height: 80vh;
  }

  .editor-section, .preview-section {
    height: 50%;
  }

  .modal-container textarea {
    height: calc(100% - 110px);
  }
}
</style>