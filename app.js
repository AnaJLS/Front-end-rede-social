const API = 'http://localhost:3000';

function salvarSessao(token, usuario) {
  sessionStorage.setItem('token', token);
  sessionStorage.setItem('usuario', JSON.stringify(usuario));
}

function limparSessao() {
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('usuario');
}

function getToken() {
  return sessionStorage.getItem('token');
}

function getUsuarioLogado() {
  const dado = sessionStorage.getItem('usuario');
  return dado ? JSON.parse(dado) : null;
}

function estaLogado() {
  return !!getToken();
}

window.addEventListener('load', function () {
  if (estaLogado()) {
    mostrarApp();
  }
  // Permite enviar login com Enter
  document.getElementById('loginSenha').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') fazerLogin();
  });
});


function mostrarAba(aba) {
  document.getElementById('abaLogin').classList.toggle('escondido', aba !== 'login');
  document.getElementById('abaCadastro').classList.toggle('escondido', aba !== 'cadastro');

  document.querySelectorAll('.tab-btn').forEach(function (btn, idx) {
    const nomes = ['login', 'cadastro'];
    btn.classList.toggle('ativo', nomes[idx] === aba);
  });

  document.getElementById('erroLogin').textContent = '';
  document.getElementById('erroCadastro').textContent = '';
  document.getElementById('sucessoCadastro').textContent = '';
}


function fazerCadastro() {
  var nome  = document.getElementById('cadNome').value.trim();
  var login = document.getElementById('cadLogin').value.trim();
  var senha = document.getElementById('cadSenha').value;
  var img   = document.getElementById('cadImg').value.trim();

  var erroEl    = document.getElementById('erroCadastro');
  var sucessoEl = document.getElementById('sucessoCadastro');

  erroEl.textContent    = '';
  sucessoEl.textContent = '';

  if (!nome || !login || !senha) {
    erroEl.textContent = 'Preencha nome, login e senha.';
    return;
  }

  var body = { nome: nome, login: login, senha: senha };
  if (img) body.img = img;

  fetch(API + '/usuarios', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
    .then(function (res) { return res.json().then(function (d) { return { ok: res.ok, d: d }; }); })
    .then(function (r) {
      if (r.ok) {
        sucessoEl.textContent = 'Conta criada! Faça login.';
        document.getElementById('cadNome').value  = '';
        document.getElementById('cadLogin').value = '';
        document.getElementById('cadSenha').value = '';
        document.getElementById('cadImg').value   = '';
        setTimeout(function () { mostrarAba('login'); }, 1500);
      } else {
        erroEl.textContent = r.d.msg || 'Erro ao criar conta.';
      }
    })
    .catch(function () {
      erroEl.textContent = 'Não foi possível conectar ao servidor.';
    });
}

function fazerLogin() {
  var login = document.getElementById('loginUsuario').value.trim();
  var senha = document.getElementById('loginSenha').value;
  var erroEl = document.getElementById('erroLogin');

  erroEl.textContent = '';

  if (!login || !senha) {
    erroEl.textContent = 'Preencha login e senha.';
    return;
  }

  fetch(API + '/usuarios/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login: login, senha: senha })
  })
    .then(function (res) { return res.json().then(function (d) { return { ok: res.ok, d: d }; }); })
    .then(function (r) {
      if (r.ok) {
        salvarSessao(r.d.token, r.d.usuario);
        mostrarApp();
      } else {
        erroEl.textContent = r.d.msg || 'Erro ao fazer login.';
      }
    })
    .catch(function () {
      erroEl.textContent = 'Não foi possível conectar ao servidor.';
    });
}


function fazerLogout() {
  limparSessao();
  document.getElementById('telaApp').classList.add('escondido');
  document.getElementById('telaAuth').classList.remove('escondido');
  document.getElementById('loginUsuario').value = '';
  document.getElementById('loginSenha').value   = '';
  document.getElementById('feed').innerHTML = '<div class="carregando">Carregando posts...</div>';
}


function mostrarApp() {
  document.getElementById('telaAuth').classList.add('escondido');
  document.getElementById('telaApp').classList.remove('escondido');

  var user = getUsuarioLogado();
  renderizarNavbar(user);
  renderizarAvatarCriarPost(user);
  carregarPosts();
}

function renderizarNavbar(user) {
  var el = document.getElementById('navbarUsuario');
  el.innerHTML =
    criarAvatarHTML(user, false) +
    '<span class="nome-usuario">' + escapeHtml(user.nome) + '</span>' +
    '<button class="btn-sair" onclick="fazerLogout()">Sair</button>';
}

function renderizarAvatarCriarPost(user) {
  var el = document.getElementById('fotoUsuarioCriar');
  if (user.img) {
    el.src   = user.img;
    el.style.display = 'block';
    el.onerror = function () { this.style.display = 'none'; };
  } else {
    el.style.display = 'none';
  }
}
