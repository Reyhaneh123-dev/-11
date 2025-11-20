/* ---------- داده‌ها و کمکی‌ها ---------- */

// نمونه سوال‌ها (قابل توسعه)
const QUIZ_ITEMS = [
  // سوال 1 (نمودار ون): A={-1,5,11}, B={-2}
  {
    id:1,
    type:'venn',
    title:'با توجه به نمودار مقابل، کدام عدد عضو مجموعه B است؟',
    A:[-1,5,11],
    B:[-2],
    choices:[-1,11,-2,5],
    answerIndex:2,
    points:10
  },
  // سوال 2: گزینه نادرست (۳)
  {
    id:2,
    type:'mcq',
    title:'کدام گزینه نادرست است؟',
    choices:[
      "(Z - R) ⊆ Q",
      "(Z - W) ⊆ (Z - N)",
      "(Q - Z) ∩ W = W",
      "(W - N) ⊆ Z"
    ],
    answerIndex:2,
    points:10
  },
  // سوال 3: A contains {5},{8},8,{3,4}
  {
    id:3,
    type:'mcq',
    title:'اگر A = { {5}, {8}, 8, {3,4} } باشد، کدام مورد درست است؟',
    choices:['5 ∈ A','3 ∈ A','{4} ∈ A','8 ∈ A'],
    answerIndex:3,
    points:10
  },
  // سوال 4: (A ∪ B) - (B ∩ C) => {1,2,3,5}
  {
    id:4,
    type:'mcq',
    title:'اگر C={-1,1,7,4}, B={-1,5,4}, A={1,2,3,4,5} آنگاه (A ∪ B) - (B ∩ C) کدام است؟',
    choices:[
      '{1,2,3,5}',
      '{-1,4}',
      '{1,2,3,4,-1}',
      '{1,2,5,-1}'
    ],
    answerIndex:0,
    points:10
  },
  // سوال‌های اضافی نمونه (5..12) میتونی اضافه کنی یا ویرایش کنی
];

// وضعیت برنامه (localStorage-backed)
function getProfile(){ return {
  name: localStorage.getItem('userName')||'نام',
  last: localStorage.getItem('userLastName')||'نام خانوادگی',
  score: Number(localStorage.getItem('userScore')||0),
  savedQuestions: JSON.parse(localStorage.getItem('savedQuestions')||'[]')
}; }
function saveProfileObj(p){
  localStorage.setItem('userName', p.name);
  localStorage.setItem('userLastName', p.last);
  localStorage.setItem('userScore', String(p.score));
  localStorage.setItem('savedQuestions', JSON.stringify(p.savedQuestions||[]));
}

/* ---------- پروفایل و UI عمومی ---------- */
document.addEventListener('DOMContentLoaded', ()=>{
  // بارگذاری پروفایل در هر صفحه در صورت وجود المنت‌ها
  const p = getProfile();
  const pf = document.getElementById('profileFullName');
  if(pf) pf.innerText = p.name + ' ' + p.last;
  const ps = document.getElementById('profileScore');
  if(ps) ps.innerText = 'امتیاز: ' + p.score;
  const img = document.getElementById('profileImage');
  if(img && localStorage.getItem('profileImage')) img.src = localStorage.getItem('profileImage');

  // دکمه نمایش ذخیره‌شده‌ها
  const vs = document.getElementById('viewSavedBtn');
  if(vs){
    vs.onclick = ()=> {
      const modal = document.getElementById('savedModal');
      if(modal) {
        document.getElementById('savedName').innerText = p.name;
        document.getElementById('savedLast').innerText = p.last;
        document.getElementById('savedScore').innerText = p.score;
        modal.classList.remove('hidden');
      }
    };
  }
  const closeModal = document.getElementById('closeModal');
  if(closeModal) closeModal.onclick = ()=> document.getElementById('savedModal').classList.add('hidden');

  // پروفایل عکس و کلیک به آپلود
  if(img){
    img.onclick = ()=> document.getElementById('uploadProfile').click();
    const up = document.getElementById('uploadProfile');
    if(up) up.addEventListener('change', function(){
      const reader = new FileReader();
      reader.onload = ()=> {
        img.src = reader.result;
        localStorage.setItem('profileImage', reader.result);
      };
      if(this.files[0]) reader.readAsDataURL(this.files[0]);
    });
  }

  // پویا کردن quiz box در صفحه 4
  const qb = document.getElementById('quizBox');
  if(qb) renderQuiz();
});

/* ذخیره پروفایل و رفتن به صفحه بعد (page2 -> page3) */
function saveProfileAndProceed(){
  const fn = document.getElementById('firstName').value.trim();
  const ln = document.getElementById('lastName').value.trim();
  if(!fn||!ln){ alert('نام و نام خانوادگی را وارد کنید'); return; }
  const p = getProfile();
  p.name = fn; p.last = ln;
  saveProfileObj(p);
  window.location.href = 'page3.html';
}

/* ---------- تبدیل شرط کلامی به ریاضی ---------- */
function convertToMath(condText){
  let cond = condText.trim();
  cond = cond.replace(/بزرگتر مساوی/gi, "≥")
             .replace(/کوچکتر مساوی/gi, "≤")
             .replace(/بزرگتر/gi, ">")
             .replace(/کوچکتر/gi, "<")
             .replace(/مساوی/gi, "=")
             .replace(/و/gi, " ∧ ")
             .replace(/یا/gi, " ∨ ");
  return cond;
}

/* ---------- صفحه 3: نمایش ریاضی و اعضا ---------- */
function showMath(){
  const el = document.getElementById('textCondition');
  if(!el) return;
  const cond = el.value.trim();
  if(!cond){ alert('لطفاً شرط را وارد کنید!'); return; }
  document.getElementById('mathResult').innerText = `{ x | ${convertToMath(cond)} }`;
}

/* استخراج اعداد از متن شرط (ساده) */
function extractNumbers(condText){
  const nums = condText.match(/-?\d+/g);
  if(!nums) return [];
  return nums.map(s=>parseInt(s,10));
}

/* نمایش اعضا دقیق یا پیش‌نمایش برای نامتناهی (5 عدد اول) */
function showMembers(){
  const set = document.getElementById('knownSet').value;
  const condText = document.getElementById('textCondition').value.trim();
  const membersBox = document.getElementById('membersBox');
  if(!set){ alert('لطفاً یک مجموعه انتخاب کنید!'); return; }
  if(!condText){ alert('لطفاً شرط را وارد کنید!'); return; }

  const nums = extractNumbers(condText);
  let lower = null, upper = null;
  if(nums.length>=1) lower = nums[0];
  if(nums.length>=2) upper = nums[1];

  let msg = '';
  // برای مجموعه‌های نمایش‌پذیر N,W,Z
  if(['N','W','Z'].includes(set)){
    // اگر بازه مشخص
    if(lower!==null && upper!==null){
      // پر کردن از lower تا upper
      const arr = [];
      for(let i=lower;i<=upper;i++) arr.push(i);
      msg = '{ ' + arr.join(', ') + ' }';
    } else if(lower!==null){
      // نامتناهی بالا — نشان ده 5 عدد اول
      const arr=[];
      for(let i=lower;i<lower+5;i++) arr.push(i);
      msg = '{ ' + arr.join(', ') + ' , ... }';
    } else {
      msg = 'نمایش اعضا امکان‌پذیر نیست (بدون محدوده مشخص)';
    }
  } else {
    msg = 'نمایش اعضا امکان‌پذیر نیست (نامتناهی یا غیرقابل نمایش)';
  }
  membersBox.style.textAlign = 'left';
  membersBox.innerText = msg;
}

/* ---------- رسم نمودار ون و محور (صفحه 3) ---------- */
function showVenn(){
  const canvas = document.getElementById('vennCanvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0,0,canvas.width,canvas.height);

  const set = document.getElementById('knownSet').value;
  const condText = document.getElementById('textCondition').value.trim();
  // برای سادگی: فقط وقتی مجموعه N/W/Z و بازه مشخص داریم رسم می‌کنیم
  const nums = extractNumbers(condText);
  let lower = nums[0]!==undefined?nums[0]:null;
  let upper = nums[1]!==undefined?nums[1]:null;

  if(!['N','W','Z'].includes(set) || lower===null){
    ctx.font='18px Tahoma'; ctx.fillStyle='red';
    ctx.textAlign='center';
    ctx.fillText('نمایش نمودار امکان‌پذیر نیست', canvas.width/2, canvas.height/2);
    return;
  }

  // محتوای اعضا:
  let arr = [];
  if(upper!==null){
    for(let i=lower;i<=upper;i++) arr.push(i);
  } else {
    for(let i=lower;i<lower+5;i++) arr.push(i);
    // نامتناهی: نمایشی با ضلع باز؛ در وِنو این را با فلش نشان می‌دهیم
  }

  // دایره و نوشتن اعداد داخل آن
  const cx = canvas.width/2, cy = canvas.height/2, r = Math.min(110, canvas.height/2-10);
  ctx.beginPath(); ctx.arc(cx,cy,r,0,2*Math.PI); ctx.strokeStyle='blue'; ctx.lineWidth=3; ctx.stroke();

  ctx.fillStyle='black'; ctx.font='16px Tahoma'; ctx.textAlign='center';
  // درون دایره چرخش افقی
  const step = Math.PI*2 / Math.max(arr.length,1);
  for(let i=0;i<arr.length;i++){
    const angle = -Math.PI/2 + (i+1)*step;
    const x = cx + (r-30)*Math.cos(angle);
    const y = cy + (r-30)*Math.sin(angle);
    ctx.fillText(String(arr[i]), x, y+6);
  }

  // اگر نامتناهی (upper==null) رسم ضلع باز: یک فلش در سمت راست یا چپ
  if(upper===null){
    // فرض ادامه به سمت مثبت (راست)
    ctx.beginPath();
    ctx.moveTo(cx + r - 10, cy);
    ctx.lineTo(cx + r + 40, cy);
    ctx.strokeStyle='black'; ctx.lineWidth=2; ctx.stroke();
    // نوک فلش
    ctx.beginPath();
    ctx.moveTo(cx + r + 30, cy-6);
    ctx.lineTo(cx + r + 40, cy);
    ctx.lineTo(cx + r + 30, cy+6);
    ctx.fillStyle='black'; ctx.fill();
  }
}

/* ---------- رسم محور (صفحه 3) - ساده و مطابق قوانین ---------- */
function showAxis(){
  const canvas = document.getElementById('axisCanvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0,0,canvas.width,canvas.height);

  const set = document.getElementById('knownSet').value;
  const condText = document.getElementById('textCondition').value.trim();
  const nums = extractNumbers(condText);
  const lower = nums[0]!==undefined?nums[0]:null;
  const upper = nums[1]!==undefined?nums[1]:null;
  const membersBox = document.getElementById('membersBox');

  // شرط‌ها برای محور نمایش
  if(['Q','I'].includes(set)){
    // خطا وسط چین
    if(membersBox){ membersBox.style.textAlign='center'; membersBox.innerText='نمایش محور امکان‌پذیر نیست'; }
    ctx.font='18px Tahoma'; ctx.fillStyle='red'; ctx.textAlign='center';
    ctx.fillText('نمایش محور امکان‌پذیر نیست', canvas.width/2, canvas.height/2);
    return;
  }

  // رسم محور کلی
  const startX = 40, endX = canvas.width - 40, y = canvas.height/2;
  ctx.beginPath(); ctx.moveTo(startX,y); ctx.lineTo(endX,y); ctx.strokeStyle='black'; ctx.lineWidth=2; ctx.stroke();

  // اگر بازه مشخص است و متناهی: روی همه اعداد عضو نقطه بزن
  if(lower!==null && upper!==null){
    // برای نمودار سادگی: فاصله بین اعداد = (endX-startX)/(upper-lower+2)
    const count = upper - lower + 1;
    const spacing = (endX - startX) / Math.max(count+1, 6);
    let idx=0;
    ctx.fillStyle='black'; ctx.font='14px Tahoma'; ctx.textAlign='center';
    for(let val=lower; val<=upper; val++){
      const x = startX + spacing*(idx+1);
      ctx.beginPath(); ctx.arc(x,y,5,0,2*Math.PI); ctx.fill();
      ctx.fillText(String(val), x, y - 12);
      idx++;
    }
    // رسم مستطیل عمودی از نیم واحد قبل تا نیم واحد بعد (نیم واحد به پیکسل تبدیل ساده)
    const left = startX + spacing*(0.5);
    const right = startX + spacing*(count + 0.5);
    const rectTop = y - 40, rectBottom = y + 40;
    ctx.strokeStyle='rgba(33,150,243,0.9)'; ctx.lineWidth=2;
    ctx.strokeRect(left, rectTop, right-left, rectBottom-rectTop);
  } else if(lower!==null){
    // نامتناهی: نمایش 5 عدد ابتدایی
    const arr = [];
    for(let i=0;i<5;i++) arr.push(lower + i);
    const count = arr.length;
    const spacing = (endX - startX) / Math.max(count+1, 6);
    for(let i=0;i<count;i++){
      const x = startX + spacing*(i+1);
      ctx.beginPath(); ctx.arc(x,y,5,0,2*Math.PI); ctx.fill();
      ctx.fillText(String(arr[i]), x, y - 12);
    }
    // مستطیل یک‌طرفه: ضلع نزدیک عدد ابتدایی با نیم واحد فاصله
    const left = startX + spacing*(0.5);
    const rectTop = y - 40, rectBottom = y + 40;
    ctx.strokeStyle='rgba(33,150,243,0.9)'; ctx.lineWidth=2;
    // رسم مستطیل با ضلع باز: از left تا راستِ canvas (نشان دهنده ادامه)
    ctx.beginPath();
    ctx.moveTo(left, rectTop);
    ctx.lineTo(endX-10, rectTop);
    ctx.lineTo(endX-10, rectBottom);
    ctx.lineTo(left, rectBottom);
    ctx.closePath();
    ctx.stroke();
    // رسم فلش جهت ادامه (فرض راست)
    ctx.beginPath();
    ctx.moveTo(endX-10, y);
    ctx.lineTo(endX+12, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(endX+6, y-6);
    ctx.lineTo(endX+12, y);
    ctx.lineTo(endX+6, y+6);
    ctx.fillStyle='black'; ctx.fill();
  } else {
    // نامشخص
    if(membersBox){ membersBox.style.textAlign='center'; membersBox.innerText='نمایش محور امکان‌پذیر نیست'; }
    ctx.font='18px Tahoma'; ctx.fillStyle='red'; ctx.textAlign='center';
    ctx.fillText('نمایش محور امکان‌پذیر نیست', canvas.width/2, canvas.height/2);
  }
}

/* ---------- صفحه 4: عملیات درست مجموعه‌ها ---------- */
function setOperationResult(Aset, Bset, operation){
  // Aset, Bset : arrays of numbers (finite). If any is null/undefined => non-finite or not provided.
  const uniq = arr => Array.from(new Set(arr));
  let res;
  if(operation==='union'){
    res = uniq(Aset.concat(Bset)).sort((a,b)=>a-b);
    return res;
  } else if(operation==='intersection'){
    res = Aset.filter(x=>Bset.includes(x));
    return uniq(res).sort((a,b)=>a-b);
  } else if(operation==='difference'){
    res = Aset.filter(x=>!Bset.includes(x));
    return uniq(res).sort((a,b)=>a-b);
  } else if(operation==='subset'){
    // آیا همه اعضای Aset در Bset هستند؟
    const allIn = Aset.every(x=>Bset.includes(x));
    return allIn ? 'بله' : 'خیر';
  }
  return null;
}

/* helper برای تبدیل انتخاب کاربر به مجموعهٔ عددی (برای page4) */
function parseUserEnteredSet(text){
  // کاربر ممکن است اعداد را با فضا وارد کند => تبدیل به آرایه اعداد
  if(!text) return [];
  const parts = text.trim().split(/\s+/);
  const nums = parts.map(s=>parseInt(s,10)).filter(n=>!isNaN(n));
  return nums;
}

/* اجرای عملیات در page4 */
function handleDisplayChange(){
  const dt = document.getElementById('displayType').value;
  const kSel = document.getElementById('knownSetSelect');
  const mb = document.getElementById('memberBox');
  if(dt==='knownSet'){ kSel.classList.remove('hidden'); mb.innerText=''; }
  else { kSel.classList.add('hidden'); mb.innerText=''; }
}

function showOperations(){
  const dt = document.getElementById('displayType').value;
  const k = document.getElementById('knownSetSelect').value;
  const op = document.getElementById('operationSelect').value;
  const memberBox = document.getElementById('memberBox');

  // مثال ساده: A را از ورودی فرضی یا ثابت بگیر
  // برای دمو: A = {1,2,3,4,5}
  const A = [1,2,3,4,5];
  let B;
  if(dt==='knownSet'){
    switch(k){
      case 'N': B=[1,2,3,4,5]; break;
      case 'W': B=[0,1,2,3,4]; break;
      case 'Z': B=[-2,-1,0,1,2]; break;
      default: B=[];
    }
  } else if(dt==='list'){
    B = [1,2,3,4,5];
  } else {
    B = [1,2,3,4,5];
  }

  if(op==='subset'){
    const ans = setOperationResult(A,B,'subset');
    memberBox.innerText = `A ⊆ B ؟ ${ans}`;
  } else {
    const res = setOperationResult(A,B,op);
    memberBox.innerText = Array.isArray(res) ? ('{ ' + res.join(', ') + ' }') : String(res);
  }
}

/* ---------- صفحه 4: Quiz rendering + actions ---------- */
let currentQuestionIndex = 0;

function renderQuiz(){
  const box = document.getElementById('quizBox');
  if(!box) return;
  box.innerHTML = '';
  // نمایش سوال فعلی
  const q = QUIZ_ITEMS[currentQuestionIndex];
  if(!q) { box.innerHTML = '<p>سوالی نیست</p>'; return; }

  const title = document.createElement('h3');
  title.innerText = `سوال ${currentQuestionIndex+1}: ${q.title}`;
  box.appendChild(title);

  // اگر نوع venn و داده داشته باشه، رسم ون کوچک
  if(q.type==='venn'){
    // canvas
    const c = document.createElement('canvas');
    c.width = 420; c.height = 160;
    box.appendChild(c);
    drawMiniVenn(c, q);
  } else {
    // متن (برای mcq معمولی)
  }

  // گزینه‌ها
  const list = document.createElement('div');
  list.className = 'choices';
  for(let i=0;i<q.choices.length;i++){
    const btn = document.createElement('button');
    btn.style.display='block'; btn.style.width='80%'; btn.style.margin='8px auto';
    btn.innerText = `${i+1})  ${q.choices[i]}`;
    btn.onclick = ()=> answerQuestion(i);
    list.appendChild(btn);
  }
  box.appendChild(list);

  // جای نمایش نتیجه این سوال
  const res = document.createElement('div');
  res.id = 'quizResult';
  res.className = 'result-box';
  box.appendChild(res);

  // توضیح ذخیره
  const saveNote = document.createElement('p');
  saveNote.style.textAlign='center';
  saveNote.innerText = 'برای ذخیره سوال دکمه "ذخیره سوال" را بزنید.';
  box.appendChild(saveNote);
}

function drawMiniVenn(canvas, q){
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0,0,canvas.width,canvas.height);
  const cx = 140, cy = 80, r = 60;
  // دایره بزرگ (A)
  ctx.beginPath(); ctx.arc(cx,cy,r,0,2*Math.PI); ctx.strokeStyle='black'; ctx.stroke();
  ctx.font='14px Tahoma'; ctx.textAlign='center';
  // اعداد A درون دایره بزرگ
  const A = q.A;
  for(let i=0;i<A.length;i++){
    ctx.fillText(String(A[i]), cx - r/3 + (i*18), cy - 6 + (i%2?14:-6));
  }
  ctx.fillText('A', cx - r - 10, cy - r - 6);

  // دایره کوچک (B)
  const bx = 300, by = 80, br = 28;
  ctx.beginPath(); ctx.arc(bx,by,br,0,2*Math.PI); ctx.stroke();
  ctx.fillText(String(q.B[0]), bx, by);
  ctx.fillText('B', bx + br + 12, by - br - 6);
}

/* پاسخ به سوال */
function answerQuestion(choiceIndex){
  const q = QUIZ_ITEMS[currentQuestionIndex];
  const resBox = document.getElementById('quizResult');
  if(!q || !resBox) return;
  const correct = (choiceIndex === q.answerIndex);
  const p = getProfile();
  let message = correct ? `پاسخ صحیح! امتیاز: ${q.points}` : `پاسخ نادرست. پاسخ صحیح گزینه ${q.answerIndex+1}`;
  resBox.style.textAlign='center';
  resBox.innerText = message;
  if(correct){
    p.score += q.points;
    saveProfileObj(p);
    // بروزرسانی نمایش امتیاز بالای صفحه
    const ps = document.getElementById('profileScore');
    if(ps) ps.innerText = 'امتیاز: ' + p.score;
  }
}

/* ذخیره سوال در پروفایل */
function saveCurrentQuestion(){
  const p = getProfile();
  const q = QUIZ_ITEMS[currentQuestionIndex];
  if(!q) return alert('سوالی نیست برای ذخیره');
  if(!p.savedQuestions) p.savedQuestions = [];
  // جلوگیری از ذخیره تکراری
  if(p.savedQuestions.find(s=>s.id===q.id)) return alert('قبلاً ذخیره شده');
  p.savedQuestions.push({ id:q.id, title:q.title });
  saveProfileObj(p);
  alert('سوال ذخیره شد و در بخش حساب کاربری قرار گرفت');
}

/* سوال بعدی */
function nextQuestion(){
  currentQuestionIndex++;
  if(currentQuestionIndex>=QUIZ_ITEMS.length) {
    currentQuestionIndex = 0; // بازگشت به اول
  }
  renderQuiz();
}
