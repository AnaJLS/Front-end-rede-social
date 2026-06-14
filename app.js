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

var cacheUsuarios = {};

function carregarPosts() {
  fetch(API + '/usuarios')
    .then(function (r) { return r.json(); })
    .then(function (usuarios) {
      if (Array.isArray(usuarios)) {
        usuarios.forEach(function (u) { cacheUsuarios[u.id] = u; });
      }
      return fetch(API + '/posts');
    })
    .then(function (r) {
      if (!r.ok) {
        document.getElementById('feed').innerHTML =
          '<div class="sem-posts">Nenhum post ainda. Seja o primeiro! ✨</div>';
        return;
      }
      return r.json();
    })
    .then(function (posts) {
      if (!posts) return;
      renderizarFeed(posts);
    })
    .catch(function () {
      document.getElementById('feed').innerHTML =
        '<div class="sem-posts">Erro ao carregar posts. Verifique se o servidor está ativo.</div>';
    });
}

function renderizarFeed(posts) {
  var feed = document.getElementById('feed');
  if (!posts.length) {
    feed.innerHTML = '<div class="sem-posts">Nenhum post ainda. Seja o primeiro! ✨</div>';
    return;
  }

  var html = '';
  var ordenados = posts.slice().reverse();
  ordenados.forEach(function (post) {
    html += renderizarPostHTML(post);
  });
  feed.innerHTML = html;
}

function renderizarPostHTML(post) {
  var user       = getUsuarioLogado();
  var autorInfo  = cacheUsuarios[post.usuario] || { nome: 'Usuário #' + post.usuario };
  var ehDono     = user && user.id === post.usuario;
  var jaLikei    = user && post.likes && post.likes.some(function (l) { return l.usuario === user.id; });
  var qtdLikes   = post.likes ? post.likes.length : 0;
  var qtdComents = post.comentarios ? post.comentarios.length : 0;

  var botoesAcao = '';
  if (ehDono) {
    botoesAcao =
      '<button class="btn-acao" onclick="abrirModalEditarPost(' + post.id + ')">✏️ Editar</button>' +
      '<button class="btn-perigo" onclick="deletarPost(' + post.id + ')">🗑 Excluir</button>';
  }

  var imagemHTML = '';
  if (post.img) {
    imagemHTML = '<img src="' + escapeHtml(post.img) + '" class="post-imagem" alt="imagem do post" onerror="this.style.display=\'none\'" />';
  }

  var textoHTML = '';
  if (post.texto) {
    textoHTML = '<div class="post-texto">' + escapeHtml(post.texto) + '</div>';
  }

  var badgeEditado = post.editado ? '<span class="badge-editado">editado</span>' : '';

  return (
    '<div class="post-card" id="post-' + post.id + '">' +
      '<div class="post-header">' +
        '<div class="post-autor">' +
          criarAvatarHTML(autorInfo, false) +
          '<div class="post-info-autor">' +
            '<div class="nome">' + escapeHtml(autorInfo.nome) + badgeEditado + '</div>' +
            '<div class="data">' + formatarData(post.data) + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="post-acoes-menu">' + botoesAcao + '</div>' +
      '</div>' +
      textoHTML +
      imagemHTML +
      '<div class="post-contadores">' +
        '<span>' + qtdLikes + (qtdLikes === 1 ? ' curtida' : ' curtidas') + '</span>' +
        '<span>' + qtdComents + (qtdComents === 1 ? ' comentário' : ' comentários') + '</span>' +
      '</div>' +
      '<div class="post-acoes-bar">' +
        '<button class="btn-like ' + (jaLikei ? 'curtido' : '') + '" onclick="toggleLike(' + post.id + ')">' +
          '<span class="icone-like">' + (jaLikei ? '❤️' : '🤍') + '</span> Curtir' +
        '</button>' +
        '<button class="btn-comentar" onclick="toggleComentarios(' + post.id + ')">' +
          '💬 Comentar' +
        '</button>' +
      '</div>' +
      renderizarComentariosHTML(post) +
    '</div>'
  );
}

function criarPost() {
  var texto  = document.getElementById('textoNovoPost').value.trim();
  var img    = document.getElementById('imgNovoPost').value.trim();
  var erroEl = document.getElementById('erroNovoPost');

  erroEl.textContent = '';

  if (!texto && !img) {
    erroEl.textContent = 'Digite algo ou adicione uma imagem.';
    return;
  }

  var body = {};
  if (texto) body.texto = texto;
  if (img)   body.img   = img;

  fetch(API + '/posts', {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': 'Bearer ' + getToken()
    },
    body: JSON.stringify(body)
  })
    .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
    .then(function (r) {
      if (r.ok) {
        document.getElementById('textoNovoPost').value = '';
        document.getElementById('imgNovoPost').value   = '';
        carregarPosts();
      } else {
        erroEl.textContent = r.d.msg || 'Erro ao publicar.';
      }
    })
    .catch(function () { erroEl.textContent = 'Erro de conexão.'; });
}

function deletarPost(id) {
  if (!confirm('Tem certeza que deseja excluir este post?')) return;

  fetch(API + '/posts/' + id, {
    method: 'DELETE',
    headers: { 'Authorization': 'Bearer ' + getToken() }
  })
    .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
    .then(function (r) {
      if (r.ok) {
        carregarPosts();
      } else {
        alert(r.d.msg || 'Erro ao excluir.');
      }
    })
    .catch(function () { alert('Erro de conexão.'); });
}

var _idPostEditando = null;

function abrirModalEditarPost(id) {
  fetch(API + '/posts/' + id)
    .then(function (r) { return r.json(); })
    .then(function (post) {
      _idPostEditando = id;
      document.getElementById('editTextoPost').value = post.texto || '';
      document.getElementById('editImgPost').value   = post.img   || '';
      document.getElementById('erroEditPost').textContent = '';
      document.getElementById('modalEditarPost').classList.remove('escondido');
    })
    .catch(function () { alert('Erro ao carregar post.'); });
}

function salvarEdicaoPost() {
  var texto  = document.getElementById('editTextoPost').value.trim();
  var img    = document.getElementById('editImgPost').value.trim();
  var erroEl = document.getElementById('erroEditPost');

  erroEl.textContent = '';

  if (!texto && !img) {
    erroEl.textContent = 'O post precisa ter texto ou imagem.';
    return;
  }

  var body = {};
  if (texto) body.texto = texto;
  if (img)   body.img   = img;

  fetch(API + '/posts/' + _idPostEditando, {
    method: 'PUT',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': 'Bearer ' + getToken()
    },
    body: JSON.stringify(body)
  })
    .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
    .then(function (r) {
      if (r.ok) {
        fecharModal('modalEditarPost');
        carregarPosts();
      } else {
        erroEl.textContent = r.d.msg || 'Erro ao editar.';
      }
    })
    .catch(function () { erroEl.textContent = 'Erro de conexão.'; });
}

function toggleLike(postId) {
  if (!estaLogado()) {
    alert('Você precisa estar logado para curtir.');
    return;
  }

  fetch(API + '/posts/' + postId + '/likes', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + getToken() }
  })
    .then(function (r) {
      if (r.ok) {
        carregarPosts();
      } else {
        return r.json().then(function (d) { alert(d.msg || 'Erro.'); });
      }
    })
    .catch(function () { alert('Erro de conexão.'); });
}