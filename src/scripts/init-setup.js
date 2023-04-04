function setup() {
  const url = new URL(browser.runtime.getURL('/src/setup/index.html'));
  url.searchParams.set(
    'session',
    new URL(window.location.href).searchParams.get('session')
  );
  url.searchParams.set('port', window.location.port);
  debugger
  alert('lol')
  const frame = document.createElement('iframe');
  const div = document.createElement('div')
  div.classList.add('test class')
  div.textContent='ddssd'
  frame.src = url.href;
  document.body.appendChild(frame);
  document.body.appendChild(div);
}

setup();
