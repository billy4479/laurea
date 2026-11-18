{
  description = "Laurea all'ultimo minuto: three little graduation games";
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };
  outputs =
    { nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        devShells.default = pkgs.mkShell {
          packages = with pkgs; [
            nodejs_24
            pnpm_12
            typescript-language-server
            svelte-language-server
            nixfmt
            shfmt
            (writeShellScriptBin "prettier" /* sh */ ''
              exec pnpm exec prettier "$@"
            '')
          ];
        };
        packages.default = pkgs.callPackage ./package.nix { nodejs = pkgs.nodejs_24; };
      }
    );
}
