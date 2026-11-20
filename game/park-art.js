window.matchaPark = { art: `
<defs>
  <clipPath id="park-bounds"><rect width="960" height="540"/></clipPath>
  <linearGradient id="lawn" x2=".85" y2="1"><stop stop-color="#c4ca76"/><stop offset="1" stop-color="#899e56"/></linearGradient>
  <linearGradient id="sand" x2="0" y2="1"><stop stop-color="#f2d2a6"/><stop offset="1" stop-color="#e1b283"/></linearGradient>
  <radialGradient id="crown" cx=".35" cy=".25"><stop stop-color="#e0e59a"/><stop offset="1" stop-color="#709751"/></radialGradient>
  <radialGradient id="blossom" cx=".35" cy=".25"><stop stop-color="#fff0d9"/><stop offset="1" stop-color="#d48392"/></radialGradient>
  <g id="trunk"><ellipse rx="34" ry="12" fill="#486438" opacity=".23"/><path d="M-7 2L-3-34l-12-18 5-4L1-43l9-16 5 4L7-34 8 2Z" fill="#81553e"/></g>
  <g id="leaves"><ellipse cy="-48" rx="34" ry="24"/><circle cx="-26" cy="-50" r="18"/><circle cx="23" cy="-56" r="22"/><circle cx="-9" cy="-68" r="24"/><circle cx="10" cy="-70" r="17"/><ellipse cx="-12" cy="-70" rx="10" ry="4" fill="#fff5dc" opacity=".3"/></g>
  <g id="tree"><use href="#trunk"/><use href="#leaves" fill="url(#crown)"/></g>
  <g id="cherry"><ellipse rx="42" ry="15" fill="#ba8761"/><ellipse cy="-4" rx="39" ry="12" fill="#748a50"/><use href="#trunk"/><use href="#leaves" fill="url(#blossom)"/></g>
  <g id="flowers"><ellipse rx="18" ry="7" fill="#657e46"/><path d="M-12 1l2-9m8 9l4-12m4 13l6-9" stroke="#a9bd6a" stroke-width="2"/><circle cx="-10" cy="-8" r="3" fill="#fff1d8"/><circle cx="2" cy="-11" r="4" fill="#edacaa"/><circle cx="12" cy="-7" r="3" fill="#fff1d8"/></g>
  <g id="bench"><ellipse cy="4" rx="29" ry="8" fill="#735737" opacity=".2"/><path d="M-23-5V4m46-9V4" stroke="#694c38" stroke-width="4"/><path d="M-26-18h51v9h-51z" fill="#a96944"/><path d="M-26-7h50l5 6h-57z" fill="#d19059"/></g>
  <g id="lamp"><ellipse rx="9" ry="4" fill="#53663e"/><path d="M0 0v-41" stroke="#634e3c" stroke-width="4"/><path d="M-6-46h12l-2 10h-8z" fill="#6f5542"/><path class="lantern" d="M-4-44h8l-2 6h-4z" fill="#ffe3a0"/><path d="M-8-46l8-7 8 7z" fill="#634e3c"/></g>
  <g id="deck">
    <path d="M-106-44l112-46 110 48-112 53z" fill="#84543b"/>
    <path d="M-106-51L6-97l110 49L4 4z" fill="#c99362"/>
    <path d="M-92-47L17-92m-91 54 109-46m-91 54 109-46m-89 55 109-46m-92 53 110-46m-90 55 109-46" stroke="#a46d49" opacity=".63"/>
    <path d="M-17-6l61-27 22 10L5 6z M-12-1l61-27m-56 32 61-27" fill="#e4aa74" stroke="#ac714b"/>
    <path d="M-98-52v-50m104 6v-51m96 101v-49m-95-1 96 44m-201-44L6-143" fill="none" stroke="#77533e" stroke-width="5"/>
    <path d="M-103-103L6-149l44 20-109 49z" fill="#fff0c3"/>
    <path d="M-59-80l109-49v8L-59-72z" fill="#d9aa72"/>
    <path d="M-92-96l109-47m-96 53 109-47m-96 53 109-47" stroke="#b5a16a" stroke-width="3" opacity=".5"/>
    <ellipse cx="21" cy="-53" rx="25" ry="11" fill="#704e39"/><ellipse cx="21" cy="-57" rx="25" ry="11" fill="#f0ce98"/><path d="M17-61h9v6h-9z" fill="#7a9a62"/>
  </g>
  <g id="shop">
    <ellipse cy="4" rx="85" ry="18" fill="#806340" opacity=".28"/>
    <path d="M-78-61l36 18v57l-36-18z" fill="#ae7651"/><path d="M-42-43l112-44v58L-42 14z" fill="#e8c791"/>
    <path d="M-83-62l22-42 25 60z" fill="#9b6246"/><path d="M-61-104l111-44 26 60-112 44z" fill="#ce9461"/><path d="M-56-92l111-44m-106 57 112-44m-107 57 112-44" stroke="#ad704b" stroke-width="2"/>
    <path d="M-46-44l113-45 17 16L-34-26z" fill="#fff0ca"/><path d="M-33-29l113-45m-98 39-10-13m30 6-10-14m31 5-10-13m31 5-10-14m31 6-10-14" stroke="#b68257" stroke-width="3"/>
    <path d="M-28 7v-30l23-9v30m16-7v-28l45-18v28z" fill="#6e8169" stroke="#916646" stroke-width="4"/><path d="M33-45v27M11-24l45-18" stroke="#ffedbd" stroke-width="2"/>
  </g>
  <g id="fence"><path d="M-24-7h48m-48 6h48m-46-11v17M0-12v17m22-17v17" stroke="#a66f46" stroke-width="3" stroke-linecap="round"/></g>
  <g id="gate"><path d="M-39 7v-38Q0-72 39-31V7" fill="none" stroke="#835539" stroke-width="8"/><path d="M-39 3v-33Q0-66 39-30V3" fill="none" stroke="#c18a55" stroke-width="4"/><rect x="-14" y="-44" width="28" height="16" rx="4" fill="#ffe5ad"/><path d="M-6-38h11v5H-6z" fill="#866043"/></g>
</defs>
<g clip-path="url(#park-bounds)">
<rect width="960" height="540" fill="url(#lawn)"/>
<path d="M0 492Q220 432 400 485T960 491M0 115Q206 66 414 125T960 77" fill="none" stroke="#eef1a8" stroke-width="48" opacity=".13"/>
<ellipse cx="690" cy="121" rx="174" ry="80" fill="#c79b75"/><ellipse cx="690" cy="117" rx="173" ry="77" fill="url(#sand)"/>
<ellipse cx="690" cy="117" rx="157" ry="67" fill="none" stroke="#fff1ce" opacity=".7"/>
<ellipse cx="795" cy="335" rx="129" ry="58" fill="url(#sand)"/>
<path d="M-30 194Q108 244 244 246T457 297Q497 314 551 296T795 335 M466 536Q471 441 467 380T457 297Q458 229 535 172L606 137 M457 297Q418 237 342 213T224 188" fill="none" stroke="#b98762" stroke-width="72"/>
<path d="M-30 194Q108 244 244 246T457 297Q497 314 551 296T795 335 M466 536Q471 441 467 380T457 297Q458 229 535 172L606 137 M457 297Q418 237 342 213T224 188" fill="none" stroke="url(#sand)" stroke-width="67"/>
<path d="M56 371l114-58 131 54-112 58z" fill="#a58553" stroke="#d4b178" stroke-width="5"/>
<path d="M79 366l115 47m-94-57 116 47m-94-57 115 47m-94-58 115 47m-92-58 114 47" stroke="#667b42" stroke-width="9" stroke-dasharray="3 5" stroke-linecap="round"/>
<path d="M583 225l47-6 20 16-47 7z" fill="#bf8faf"/><path d="M659 225l47-6 20 16-47 7z" fill="#849fa3"/>
` };
