{
  runCommand,
  fetchurl,
  unzip,
  python3,
  noto-fonts-color-emoji,
}:
let
  bigblue = fetchurl {
    url = "https://int10h.org/filez/BigBlue_Terminal_v1.0.zip";
    hash = "sha256-95OltslAnw6o6aZ4ZU/QdtcSIaa82dgta/B4F68VMvc=";
  };
in
runCommand "laurea-fonts"
  {
    nativeBuildInputs = [
      unzip
      (python3.withPackages (p: [ p.pillow ]))
    ];
  } # sh
  ''
    mkdir -p "$out"
    unzip -p ${bigblue} BigBlue_TerminalPlus.TTF > "$out/bigblue-terminal-plus.ttf"
    unzip -p ${bigblue} LICENSE.TXT > "$out/LICENSE.txt"
    python ${./render-emoji.py} ${noto-fonts-color-emoji}/share/fonts/noto/NotoColorEmoji.ttf \
      ${../src/lib/games/emoji-glyphs.json} "$out"
    cp ${./emoji-LICENSE.txt} "$out/emoji-LICENSE.txt"
  ''
