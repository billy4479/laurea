{
  lib,
  stdenv,
  fetchPnpmDeps,
  pnpm_12,
  pnpmConfigHook,
  nodejs,
  makeWrapper,
}:
stdenv.mkDerivation (finalAttrs: {
  pname = "laurea";
  version = "0.1.0";
  src = lib.fileset.toSource {
    root = ./.;
    fileset = lib.fileset.unions [
      ./src
      ./static
      ./package.json
      ./pnpm-lock.yaml
      ./pnpm-workspace.yaml
      ./svelte.config.js
      ./tsconfig.json
      ./vite.config.ts
    ];
  };
  nativeBuildInputs = [
    nodejs
    pnpm_12
    pnpmConfigHook
    makeWrapper
  ];
  pnpmDeps = fetchPnpmDeps {
    inherit (finalAttrs) pname version src;
    pnpm = pnpm_12;
    fetcherVersion = 4;
    hash = "sha256-cKGC6ExREFYdMVsPQ4C3pFvwpa6Dn3eUFlT6pHrL+eA=";
  };
  buildPhase = # sh
    ''
      runHook preBuild
      pnpm check
      pnpm build
      runHook postBuild
    '';
  doCheck = true;
  checkPhase = # sh
    ''
      pnpm test
    '';
  installPhase = # sh
    ''
      runHook preInstall
      root="$out/share/laurea"
      mkdir -p "$root"
      cp -r build "$root/"
      cp package.json pnpm-lock.yaml pnpm-workspace.yaml "$root/"
      pnpm --dir "$root" install --prod --offline --frozen-lockfile --ignore-scripts
      makeWrapper ${lib.getExe nodejs} "$out/bin/laurea" --add-flags "$root/build/index.js"
      runHook postInstall
    '';
  meta = {
    description = "Mobile graduation arcade with a local SQLite leaderboard";
    mainProgram = "laurea";
    inherit (nodejs.meta) platforms;
  };
})
