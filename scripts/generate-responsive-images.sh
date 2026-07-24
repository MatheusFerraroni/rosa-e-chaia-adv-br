#!/usr/bin/env bash

set -euo pipefail

readonly script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
readonly project_root="$(cd -- "$script_dir/.." && pwd)"
readonly image_dir="$project_root/assets/img"

if ! command -v magick >/dev/null 2>&1; then
  printf 'Erro: ImageMagick 7 não foi encontrado no PATH.\n' >&2
  exit 1
fi

readonly magick_version="$(magick -version | sed -n '1p')"

case "$magick_version" in
  "Version: ImageMagick 7."*)
    ;;
  *)
    printf 'Erro: este script requer ImageMagick 7. Versão encontrada: %s\n' "$magick_version" >&2
    exit 1
    ;;
esac

readonly work_dir="$(mktemp -d "$image_dir/.responsive-images.XXXXXX")"

cleanup() {
  rm -rf -- "$work_dir"
}

trap cleanup EXIT HUP INT TERM

generate_professional() {
  local source_name="$1"
  local output_stem="$2"
  local target_width="$3"
  local output_path="$work_dir/${output_stem}-${target_width}.webp"

  magick "$image_dir/$source_name" \
    -resize "${target_width}x>" \
    -define webp:method=6 \
    -define webp:alpha-quality=100 \
    -quality 84 \
    "$output_path"
}

generate_office() {
  local source_name="$1"
  local output_stem="$2"
  local target_width="$3"
  local output_path="$work_dir/${output_stem}-${target_width}.webp"

  magick "$image_dir/$source_name" \
    -auto-orient \
    -resize "${target_width}x>" \
    -define webp:method=6 \
    -quality 82 \
    "$output_path"
}

verify_width() {
  local output_name="$1"
  local expected_width="$2"
  local output_path="$work_dir/$output_name"
  local actual_width

  if [[ ! -s "$output_path" ]]; then
    printf 'Erro: arquivo não gerado ou vazio: %s\n' "$output_name" >&2
    exit 1
  fi

  actual_width="$(magick identify -format '%w' "$output_path")"

  if [[ "$actual_width" != "$expected_width" ]]; then
    printf 'Erro: %s deveria ter %s px de largura, mas tem %s px.\n' \
      "$output_name" "$expected_width" "$actual_width" >&2
    exit 1
  fi
}

verify_alpha() {
  local output_name="$1"
  local channels

  channels="$(magick identify -format '%[channels]' "$work_dir/$output_name")"

  case "$channels" in
    *a*)
      ;;
    *)
      printf 'Erro: o canal alfa não foi preservado em %s.\n' "$output_name" >&2
      exit 1
      ;;
  esac
}

generate_professional \
  "profissional-gabriela-chaia-recorte.png" \
  "profissional-gabriela-chaia-recorte" \
  400
generate_professional \
  "profissional-gabriela-chaia-recorte.png" \
  "profissional-gabriela-chaia-recorte" \
  720
generate_professional \
  "profissional-giane-rosa-recorte.png" \
  "profissional-giane-rosa-recorte" \
  400
generate_professional \
  "profissional-giane-rosa-recorte.png" \
  "profissional-giane-rosa-recorte" \
  720

generate_office \
  "escritorio-identidade-visual.jpg" \
  "escritorio-identidade-visual" \
  480
generate_office \
  "escritorio-identidade-visual.jpg" \
  "escritorio-identidade-visual" \
  960
generate_office \
  "escritorio-identidade-visual.jpg" \
  "escritorio-identidade-visual" \
  1800

for office_stem in \
  "escritorio-fachada" \
  "escritorio-ambiente-interno" \
  "escritorio-sala-reuniao"; do
  generate_office "${office_stem}.jpg" "$office_stem" 480
  generate_office "${office_stem}.jpg" "$office_stem" 960
done

for output_name in \
  "profissional-gabriela-chaia-recorte-400.webp" \
  "profissional-giane-rosa-recorte-400.webp"; do
  verify_width "$output_name" 400
  verify_alpha "$output_name"
done

for output_name in \
  "profissional-gabriela-chaia-recorte-720.webp" \
  "profissional-giane-rosa-recorte-720.webp"; do
  verify_width "$output_name" 720
  verify_alpha "$output_name"
done

for output_name in \
  "escritorio-identidade-visual-480.webp" \
  "escritorio-fachada-480.webp" \
  "escritorio-ambiente-interno-480.webp" \
  "escritorio-sala-reuniao-480.webp"; do
  verify_width "$output_name" 480
done

for output_name in \
  "escritorio-identidade-visual-960.webp" \
  "escritorio-fachada-960.webp" \
  "escritorio-ambiente-interno-960.webp" \
  "escritorio-sala-reuniao-960.webp"; do
  verify_width "$output_name" 960
done

verify_width "escritorio-identidade-visual-1800.webp" 1800

for generated_path in "$work_dir"/*.webp; do
  mv -f -- "$generated_path" "$image_dir/${generated_path##*/}"
done

printf 'Variantes responsivas geradas com sucesso.\n'
magick identify -format '%f | %wx%h | %b\n' "$image_dir"/*-{400,480,720,960,1800}.webp 2>/dev/null
