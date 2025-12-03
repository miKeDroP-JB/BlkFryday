# ╔══════════════════════════════════════════════════════════════════════╗
# ║  VYRA: GENESIS SECTOR - WARPDRIVE ZSH CONFIGURATION                  ║
# ║  Hyperspeed. Command Spellcasting. Neon Ritual Interface.            ║
# ╚══════════════════════════════════════════════════════════════════════╝

# === INSTANT INIT ===
if [[ -r "${XDG_CACHE_HOME:-$HOME/.cache}/p10k-instant-prompt-${(%):-%n}.zsh" ]]; then
  source "${XDG_CACHE_HOME:-$HOME/.cache}/p10k-instant-prompt-${(%):-%n}.zsh"
fi

# === ZSH OPTIONS ===
setopt AUTO_CD
setopt AUTO_PUSHD
setopt PUSHD_IGNORE_DUPS
setopt PUSHD_SILENT
setopt CORRECT
setopt EXTENDED_GLOB
setopt NO_BEEP
setopt HIST_EXPIRE_DUPS_FIRST
setopt HIST_IGNORE_DUPS
setopt HIST_IGNORE_ALL_DUPS
setopt HIST_FIND_NO_DUPS
setopt HIST_SAVE_NO_DUPS
setopt SHARE_HISTORY
setopt APPEND_HISTORY
setopt INC_APPEND_HISTORY

# === HISTORY ===
HISTFILE=~/.zsh_history
HISTSIZE=50000
SAVEHIST=50000

# === HYPERSPEED AUTOSUGGESTIONS ===
source /usr/share/zsh/plugins/zsh-autosuggestions/zsh-autosuggestions.zsh
ZSH_AUTOSUGGEST_STRATEGY=(history completion)
ZSH_AUTOSUGGEST_BUFFER_MAX_SIZE=20
ZSH_AUTOSUGGEST_HIGHLIGHT_STYLE='fg=#6272a4'

# === SYNTAX HIGHLIGHTING (COMMAND SPELLCASTING) ===
source /usr/share/zsh/plugins/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh
ZSH_HIGHLIGHT_HIGHLIGHTERS=(main brackets pattern cursor)
typeset -A ZSH_HIGHLIGHT_STYLES
ZSH_HIGHLIGHT_STYLES[command]='fg=#50fa7b,bold'
ZSH_HIGHLIGHT_STYLES[builtin]='fg=#8be9fd,bold'
ZSH_HIGHLIGHT_STYLES[function]='fg=#ff79c6,bold'
ZSH_HIGHLIGHT_STYLES[alias]='fg=#bd93f9,bold'
ZSH_HIGHLIGHT_STYLES[path]='fg=#f1fa8c,underline'
ZSH_HIGHLIGHT_STYLES[globbing]='fg=#ffb86c'

# === HISTORY SUBSTRING SEARCH ===
source /usr/share/zsh/plugins/zsh-history-substring-search/zsh-history-substring-search.zsh
bindkey '^[[A' history-substring-search-up
bindkey '^[[B' history-substring-search-down

# === STARSHIP PROMPT (NEON SIGIL) ===
eval "$(starship init zsh)"

# === ZOXIDE (HYPERJUMP) ===
eval "$(zoxide init zsh)"

# === FZF (SPECTRAL SEARCH) ===
source /usr/share/fzf/key-bindings.zsh
source /usr/share/fzf/completion.zsh
export FZF_DEFAULT_OPTS='
  --color=fg:#f8f8f2,bg:#282a36,hl:#bd93f9
  --color=fg+:#f8f8f2,bg+:#44475a,hl+:#bd93f9
  --color=info:#ffb86c,prompt:#50fa7b,pointer:#ff79c6
  --color=marker:#ff79c6,spinner:#ffb86c,header:#6272a4
  --border=rounded --height=40%
'

# === MODERN CLI TOOLS ===
alias ls='exa --icons --group-directories-first'
alias ll='exa -la --icons --group-directories-first'
alias lt='exa -la --icons --tree --level=2'
alias cat='bat --style=plain'
alias grep='rg'
alias find='fd'
alias top='btop'

# ╔══════════════════════════════════════════════════════════════════════╗
# ║  VYRA COMMAND MACROS - SPELL INCANTATIONS                           ║
# ╚══════════════════════════════════════════════════════════════════════╝

# === BUILD COMMANDS ===
alias build-server='vyra build --type server'
alias deploy-swarm='vyra swarm deploy'
alias spin-node='vyra node create'
alias summon-agent='vyra agent spawn'
alias clean-env='vyra env clean'
alias open-timeline='vyra timeline open'

# === FOCUS STATE COMMANDS ===
alias focus-trance='vyra focus --mode trance'
alias clarity-pulse='vyra focus --mode clarity'
alias summoning-grid='vyra grid --mode summon'

# === AGENT SWARM SHORTCUTS ===
alias swarm-status='vyra swarm status'
alias swarm-log='vyra swarm logs --follow'
alias swarm-kill='vyra swarm terminate'
alias agent-list='vyra agent list'
alias agent-inject='vyra agent inject'

# === AI STACK SHORTCUTS ===
alias ollama-run='ollama run'
alias ollama-list='ollama list'
alias ollama-pull='ollama pull'
alias tts='vyra tts'
alias whisper='vyra whisper'
alias embed='vyra embed'

# === DOCKER/PODMAN ===
alias dk='docker'
alias dkc='docker-compose'
alias dkps='docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"'
alias dklog='docker logs -f'
alias pd='podman'

# === GIT ACCELERATORS ===
alias g='git'
alias gs='git status -sb'
alias ga='git add'
alias gc='git commit -m'
alias gp='git push'
alias gl='git pull'
alias glog='git log --oneline --graph --decorate -20'
alias gd='git diff'
alias gb='git branch'
alias gco='git checkout'
alias lg='lazygit'

# === DEVELOPMENT SHORTCUTS ===
alias py='python'
alias pip='pip3'
alias nv='nvim'
alias v='nvim'
alias code='code --ozone-platform=wayland'

# === NODE/BUN/PNPM ===
alias nr='npm run'
alias ni='npm install'
alias pn='pnpm'
alias bn='bun'

# ╔══════════════════════════════════════════════════════════════════════╗
# ║  VYRA CHANNEL 0 - INTENT INTERFACE                                   ║
# ╚══════════════════════════════════════════════════════════════════════╝

# Quick channel access
alias v0='vyra channel 0'
alias vyra-ask='vyra ask'
alias vyra-do='vyra execute'

# === ENVIRONMENT VARIABLES ===
export EDITOR='nvim'
export VISUAL='nvim'
export PAGER='bat'
export MANPAGER="sh -c 'col -bx | bat -l man -p'"
export TERM='xterm-256color'

# === PATH EXTENSIONS ===
export PATH="$HOME/.local/bin:$HOME/.cargo/bin:$HOME/go/bin:$HOME/.bun/bin:$PATH"
export PATH="$HOME/.vyra/bin:$PATH"

# === AI ENVIRONMENT ===
export OLLAMA_HOST="http://localhost:11434"
export VYRA_CHANNEL="0"
export VYRA_HOME="$HOME/.vyra"

# === WELCOME SIGIL ===
if [[ -z "$VYRA_SILENT" ]]; then
  echo ""
  echo -e "\033[38;5;135m╔═══════════════════════════════════════════════════════════╗\033[0m"
  echo -e "\033[38;5;135m║\033[0m  \033[38;5;207m⟡\033[0m \033[1;38;5;219mVYRA: GENESIS SECTOR\033[0m                                 \033[38;5;135m║\033[0m"
  echo -e "\033[38;5;135m║\033[0m     \033[38;5;245mPortable AI Development Universe v1.0\033[0m               \033[38;5;135m║\033[0m"
  echo -e "\033[38;5;135m╠═══════════════════════════════════════════════════════════╣\033[0m"
  echo -e "\033[38;5;135m║\033[0m  \033[38;5;82m●\033[0m Systems Online    \033[38;5;226m●\033[0m Swarm Ready    \033[38;5;51m●\033[0m Channel 0 Active \033[38;5;135m║\033[0m"
  echo -e "\033[38;5;135m╚═══════════════════════════════════════════════════════════╝\033[0m"
  echo ""
fi

# === LOAD VYRA AGENT HOOKS ===
[[ -f "$VYRA_HOME/hooks/shell-init.zsh" ]] && source "$VYRA_HOME/hooks/shell-init.zsh"
