window.onload = () => {
  const discordUser = getCookie('discordUser');
  if (discordUser) {
    const loginBtn = document.getElementById('discordLoginBtn');
    if (loginBtn) loginBtn.style.display = 'none'; // ログイン済みなら非表示
  }

  // settings.htmlの場合のみAPI呼び出し
  if (location.pathname === '/settings.html') {
    fetch('/api/status')
      .then(res => res.json())
      .then(data => {
        document.getElementById('featureToggle').checked = data.featureEnabled;
        document.getElementById('status').textContent = data.featureEnabled ? 'ON' : 'OFF';
      });
  }
};

function toggleFeature() {
  const toggle = document.getElementById('featureToggle');
  document.getElementById('status').textContent = toggle.checked ? 'ON' : 'OFF';

  fetch('/api/toggle-feature', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled: toggle.checked })
  })
  .then(res => res.json())
  .then(data => console.log('Server Response:', data));
}

function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

function goToSettings() {
  const user = getCookie('discordUser');
  if (!user) {
    window.location.href = '/login';
  } else {
    window.location.href = '/settings.html';
  }
}

window.onload = () => {
  const discordUser = getCookie('discordUser');
  if (discordUser) {
    const loginBtn = document.getElementById('discordLoginBtn');
    if (loginBtn) loginBtn.style.display = 'none';
    loadUserData(); // ユーザー情報＋サーバー取得
  }
};

function toggleMenu() {
  const menu = document.getElementById('sideMenu');
  const icon = document.querySelector('.menu-icon');
  menu.classList.toggle('show');
  icon.classList.toggle('hide');
}

// ページ読み込み後にユーザー情報を取得し表示する関数に追記

function loadUserData() {
  fetch('/api/user')
    .then(res => res.json())
    .then(data => {
      console.log("user data:", data); // デバッグ必須

      if (data.user) {
        const serverList = document.getElementById('serverList');
        serverList.innerHTML = '';

        data.guilds.forEach(guild => {
          const div = document.createElement('div');
          div.className = 'server-item';

          const img = document.createElement('img');
          img.src = guild.icon
            ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`
            : 'https://via.placeholder.com/50?text=No+Icon';

          const name = document.createElement('span');
          name.textContent = guild.name;

          div.appendChild(img);
          div.appendChild(name);
          serverList.appendChild(div);
          
 const userControls = document.getElementById('userControls');
        const userIcon = document.getElementById('userIcon');
        userIcon.src = data.user.avatar
          ? `https://cdn.discordapp.com/avatars/${data.user.id}/${data.user.avatar}.png`
          : 'https://via.placeholder.com/40?text=NoIcon';

        userControls.style.display = 'flex';  // 表示

        // ログアウトボタンのクリックイベント
        document.getElementById('logoutBtn').addEventListener('click', () => {
          fetch('/logout')
            .then(() => {
              location.reload();
            });
        });
          });
      } else {
        // 未ログイン時は非表示
        document.getElementById('userControls').style.display = 'none';
      }

    });
}
function logout() {
  document.cookie = "discordUser=; Max-Age=0; path=/;";
  window.location.href = '/';
}