# ArmeTec — Tecnologia que devolve o seu tempo

Filme publicitário cinematográfico (Remotion + React + TypeScript + Three.js).

| Composição | Formato | Uso |
| --- | --- | --- |
| `ArmeTecFilmVertical` | 1080 × 1920 · 9:16 · 60 fps · 70 s | Reels, Stories, anúncios |
| `ArmeTecFilmHorizontal` | 1920 × 1080 · 16:9 · 60 fps · 70 s | YouTube, institucional |

Fica tudo nesta pasta (`brand-film/`), separado do app de escopo de clientes que está na raiz do repositório.

## Comandos

Instalar as dependências:

```bash
cd brand-film && npm install
```

Abrir o Remotion Studio (pré-visualização com timeline):

```bash
npm run dev
```

Verificar os tipos:

```bash
npm run typecheck
```

Renderizar o vídeo vertical (MP4 H.264):

```bash
npm run render:vertical
```

Renderizar o vídeo horizontal (MP4 H.264):

```bash
npm run render:horizontal
```

Renderizar uma imagem estática de um frame específico:

```bash
npx remotion still ArmeTecFilmVertical out/frame.jpg --frame=1818
```

Renderizar um frame representativo de cada cena, nos dois formatos:

```bash
npm run stills
```

Gerar novamente a trilha original e os efeitos sonoros (requer Python 3 + numpy):

```bash
npm run audio
```

Vetorizar novamente o logotipo oficial (depois de trocar os PNGs de `public/brand`):

```bash
npm run brand
```

> Sem GPU (servidores e containers), o Chrome renderiza o WebGL por software (ANGLE/SwiftShader, já
> configurado em `remotion.config.ts`). Para usar um Chrome/Chromium já instalado, defina
> `REMOTION_BROWSER=/caminho/do/chrome-headless-shell`.

## Estrutura

```
src/
  config/        timeline.json (roteiro, timestamps, cues de som), video, theme, brand, audio, camera, effects
  scenes/        S01S02Time · S03S04Chaos · S05Platform · S06Digital · S07Results · S08Signature
  three/         Stage (câmera, reflexos, DOF bokeh), Clock3D, ExtrudedText, ParticleMorph, materiais
  components/    CssWorld (câmera física 3D para DOM), Light (linha de luz, feixes), PostFX (grão, vinheta)
  interfaces/    Planilha, documentos/mensagens/tarefas, plataforma (dashboard, fluxos), site responsivo, devices
  typography/    SplitText (tipografia cinética por caractere), Subtitles (legendas completas)
  animations/    camera (keyframes, lentes, foco, shake), kinetic (presets de tipografia)
  transitions/   Enter (entradas entre blocos)
  audio/         Soundtrack (trilha com ducking, SFX sincronizados, narração)
scripts/         generate-audio.py, trace-logo.mjs, render-stills.mjs, stills.sh, contact.py
public/          brand/ (logo oficial), fonts/ (Inter, Space Grotesk — OFL), audio/ (trilha + sfx)
```

## Sincronização (um só arquivo)

`src/config/timeline.json` concentra **cenas, beats visuais, falas da narração e cues de efeitos sonoros**,
em segundos. Ele é lido pelo Remotion e pelo gerador de trilha. Ao receber a locução profissional,
ajuste os `start`/`end` de cada fala e os `beats`: tipografia, câmeras, legendas e efeitos acompanham. Para que a
trilha também se alinhe, rode `npm run audio` depois.

## Áudio — o que existe e o que falta

- **Trilha (`public/audio/score.wav`) e efeitos (`public/audio/sfx/*.wav`)**: originais, sintetizados do zero
  por `scripts/generate-audio.py` (osciladores, ruído filtrado, reverb por convolução), sem samples de terceiros.
  Estrutura: atmosfera e relógio → tensão crescente → suspensão no "AUTOMÁTICOS" → virada harmônica →
  groove confiante → três impactos do clímax → resolução → assinatura sonora da marca.
  É uma trilha funcional de produção; para uma campanha paga, considere substituí-la por uma trilha
  composta ou licenciada com o mesmo nome de arquivo.
- **Narração: NÃO incluída.** Não há locução gravada neste projeto. Grave a voz (PT-BR, masculina, médio-grave),
  salve em `public/audio/narration.wav` e mude `AUDIO.narration.enabled` para `true` em `src/config/audio.ts`.
  A música abaixa automaticamente (ducking) durante cada fala.

## Legendas

A camada de legendas é completa, discreta e sincronizada palavra a palavra (`typography/Subtitles.tsx`),
separada da tipografia cinética. Desligue com `EFFECTS.subtitles = false` ou com a prop:

```bash
npx remotion render ArmeTecFilmVertical out/sem-legenda.mp4 --props='{"subtitles":false}'
```

## Observações de conteúdo

- As interfaces (planilhas, sistema, site "Vértice Arquitetura") são **demonstrações ilustrativas**. O painel
  principal traz o selo "Demonstração ilustrativa". Nomes de clientes e valores são fictícios e não representam
  números de economia ou resultados.
- O logotipo usado é o oficial fornecido (PNG em `public/brand`). O símbolo 3D e o logotipo vetorial da
  assinatura são traçados automaticamente a partir desses PNGs.
- Todas as animações são determinísticas e controladas por `useCurrentFrame()`, sem `Math.random()` nem timers.
