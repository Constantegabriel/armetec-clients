# ArmeTec — Tecnologia que devolve o seu tempo

Filme publicitário cinematográfico (Remotion + React + TypeScript + Three.js).

| Composição | Formato | Uso |
| --- | --- | --- |
| `ArmeTecFilmVertical` | 1080 × 1920 · 9:16 · 60 fps · 92 s | Reels, Stories, anúncios (versão principal) |
| `ArmeTecFilmHorizontal` | 1920 × 1080 · 16:9 · 60 fps · 92 s | YouTube, institucional |

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
npx remotion still ArmeTecFilmVertical out/frame.jpg --frame=3480
```

Renderizar um frame representativo de cada cena, nos dois formatos:

```bash
npm run stills
```

Gerar novamente o sound design (requer Python 3 + numpy):

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

## Estrutura do filme

| Tempo | Cena | Arquivo |
| --- | --- | --- |
| 0–12 s | Relógio esqueletizado · "TEMPO?" · tempo acelerando · calendário | `scenes/S01S02Time.tsx` |
| 12–16,5 s | Preenchendo planilhas (planilha estilo Excel, copiar/colar) | `scenes/S03aSheets.tsx` |
| 16,5–22 s | Procurando informações (busca, conversa, versões, PDF desatualizado) | `scenes/S03bSearch.tsx` |
| 22–27,6 s | Repetindo tarefas (formulário manual repetido, cada vez mais rápido) | `scenes/S03cRepeat.tsx` |
| 27,6–39,5 s | Acúmulo · AUTOMÁTICOS (congelamento) · PROBLEMAS → CRESCIMENTO | `scenes/S03dS04Turn.tsx` |
| 39,5–53,5 s | Plataforma ArmeTec: simplificar, centralizar, automatizar | `scenes/S05Platform.tsx` |
| 53,5–66,5 s | Relatórios automáticos no WhatsApp (19:59 → 20:00) | `scenes/S06S07Connected.tsx` |
| 66,5–84 s | Mobilidade: app instalado, ambientes, celular + tablet + notebook sincronizados | `scenes/S06S07Connected.tsx` |
| 84–93 s | Menos tarefas · Mais controle · Mais produtividade · Mais tempo para crescer | `scenes/S08Results.tsx` |
| 93–99 s | Construção da logo · "Tecnologia que devolve o seu tempo." | `scenes/S09Signature.tsx` |

```
src/
  config/        timeline.json (roteiro, timestamps, cues de som), video, theme, brand, audio, camera, effects
  scenes/        cenas listadas acima
  three/         Stage (reflexos, DOF), Clock3D (relógio esqueletizado), ParticleMorph, outlines
  components/    CssWorld (câmera física 3D para DOM), Ambient, Light, PostFX
  interfaces/    Excel, SearchStory, DailyReport, PhoneScreens (WhatsApp, tela inicial), SystemApps, Devices, Platform…
  typography/    SplitText (tipografia cinética), Title (títulos com contraste por luz localizada)
  animations/    camera (rig com velocidade contínua), kinetic (revelações mascaradas)
  audio/         Soundtrack (sound design + narração com ducking)
scripts/         generate-audio.py, trace-logo.mjs, render-stills.mjs, stills.sh, contact.py
public/          brand/ (logo oficial), fonts/ (Inter, Geist, Space Grotesk — OFL), audio/sounddesign.wav
```

## Sincronização (um só arquivo)

`src/config/timeline.json` concentra **cenas, beats visuais, falas da narração e cues de efeitos sonoros**,
em segundos. Ele é lido pelo Remotion e pelo gerador de trilha. Ao receber a locução profissional,
ajuste os `start`/`end` de cada fala e os `beats`: tipografia, câmeras e efeitos acompanham. Para que a
trilha também se alinhe, rode `npm run audio` depois.

## Áudio

- **Sem música de fundo.** O áudio é só sound design + narração.
- **Sound design (`public/audio/sounddesign.wav`)**: original, sintetizado do zero por
  `scripts/generate-audio.py` a partir dos cues em `timeline.json` → `sfx` (digitação, cliques, janelas,
  papel, notificações, mensagem recebida, tiques, engrenagens, impactos, whooshes, congelamento,
  revelações tipográficas, construção da logo…). Ao mudar um cue, rode `npm run audio`.
- **Narração: ainda não incluída.** Grave a locução seguindo os tempos de `timeline.json` → `narration`
  (roteiro oficial completo, 92 s), salve em **`public/audio/narration.wav`** e mude
  `AUDIO.narration.enabled` para `true` em `src/config/audio.ts`. O sound design abaixa levemente sob a voz.

## Tipografia e legendas

Não há legendas convencionais: os únicos textos na tela são os da direção de arte (tipografia cinética,
Geist + Inter). O contraste é resolvido com áreas localizadas de sombra atrás dos títulos, camadas separadas
e profundidade de campo — sem contornos. Nenhuma tipografia extrudada em 3D.

## Observações de conteúdo

- As interfaces (planilhas, sistema, relatório no WhatsApp, apps) são **demonstrações ilustrativas**. Nomes,
  valores e o relatório diário são fictícios e não representam resultados reais de clientes. Não há integração
  real com nenhum serviço de mensagens; o ícone do app de mensagens é um desenho genérico.
- O logotipo usado é o oficial fornecido (PNG em `public/brand`). O símbolo 3D e o logotipo vetorial da
  assinatura são traçados automaticamente a partir desses PNGs.
- Todas as animações são determinísticas e controladas por `useCurrentFrame()`, sem `Math.random()` nem timers.
