#!/usr/bin/env bash
# Lukas 1.0 — controle do servidor de desenvolvimento (Express + Vite)
# Uso: scripts/server.sh {start|stop|restart|status|logs}

set -uo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PID_FILE="/tmp/lukas-dev-server.pid"
LOG_FILE="/tmp/lukas-dev-server.log"
EXPRESS_PORT=3000
VITE_PORT=5173

BOLD="\033[1m"; DIM="\033[2m"; RESET="\033[0m"
RED="\033[31m"; GREEN="\033[32m"; YELLOW="\033[33m"; CYAN="\033[36m"

line()  { printf "${DIM}────────────────────────────────────────────${RESET}\n"; }
title() { printf "\n${BOLD}${CYAN}Lukas 1.0 — Servidor de Desenvolvimento${RESET}\n"; line; }

port_status() {
    local port=$1
    if (exec 3<>"/dev/tcp/127.0.0.1/$port") 2>/dev/null; then
        exec 3<&- 2>/dev/null; exec 3>&- 2>/dev/null
        echo "on"
    else
        echo "off"
    fi
}

is_running() {
    [ -f "$PID_FILE" ] && kill -0 -- "-$(cat "$PID_FILE")" 2>/dev/null
}

do_start() {
    title
    if is_running; then
        printf "${YELLOW}já está rodando${RESET} (grupo $(cat "$PID_FILE"))\n"
        echo; do_status; line
        return 0
    fi

    printf "${CYAN}iniciando...${RESET}\n"
    cd "$PROJECT_DIR" || return 1
    setsid npm run dev > "$LOG_FILE" 2>&1 < /dev/null &
    echo "$!" > "$PID_FILE"

    printf "  Express (:%s) " "$EXPRESS_PORT"
    local tries=0
    while [ "$(port_status "$EXPRESS_PORT")" != "on" ]; do
        sleep 1; tries=$((tries + 1))
        if [ "$tries" -ge 40 ]; then
            printf "${RED}falhou (timeout)${RESET}\n  veja o log: %s\n" "$LOG_FILE"; line; return 1
        fi
    done
    printf "${GREEN}ok${RESET}\n"

    printf "  Vite    (:%s) " "$VITE_PORT"
    tries=0
    while [ "$(port_status "$VITE_PORT")" != "on" ]; do
        sleep 1; tries=$((tries + 1))
        if [ "$tries" -ge 40 ]; then
            printf "${RED}falhou (timeout)${RESET}\n  veja o log: %s\n" "$LOG_FILE"; line; return 1
        fi
    done
    printf "${GREEN}ok${RESET}\n"

    line
    printf "${GREEN}${BOLD}Lukas está rodando${RESET}\n"
    printf "  ${DIM}Frontend${RESET}  http://localhost:%s\n" "$VITE_PORT"
    printf "  ${DIM}Backend${RESET}   http://localhost:%s\n" "$EXPRESS_PORT"
    printf "  ${DIM}Log${RESET}       %s\n" "$LOG_FILE"
    line
}

do_stop() {
    title
    if ! is_running; then
        printf "${YELLOW}não está rodando${RESET}\n"; rm -f "$PID_FILE"; line
        return 0
    fi
    local pgid; pgid="$(cat "$PID_FILE")"
    printf "${CYAN}parando...${RESET} (grupo %s)\n" "$pgid"
    kill -TERM -- "-$pgid" 2>/dev/null

    local tries=0
    while kill -0 -- "-$pgid" 2>/dev/null; do
        sleep 0.5; tries=$((tries + 1))
        if [ "$tries" -ge 20 ]; then
            printf "  ${YELLOW}ainda de pé, forçando...${RESET}\n"
            kill -KILL -- "-$pgid" 2>/dev/null
            break
        fi
    done
    rm -f "$PID_FILE"
    printf "${GREEN}parado${RESET}\n"; line
}

do_restart() {
    do_stop
    do_start
}

do_status() {
    local exp vite state
    exp="$(port_status "$EXPRESS_PORT")"
    vite="$(port_status "$VITE_PORT")"
    if is_running; then state="${GREEN}rodando${RESET} (grupo $(cat "$PID_FILE"))"; else state="${RED}parado${RESET}"; fi
    printf "  Estado    %b\n" "$state"
    printf "  Backend   :%s  %b\n" "$EXPRESS_PORT" "$([ "$exp" = on ] && echo "${GREEN}online${RESET}" || echo "${DIM}offline${RESET}")"
    printf "  Frontend  :%s  %b\n" "$VITE_PORT" "$([ "$vite" = on ] && echo "${GREEN}online${RESET}" || echo "${DIM}offline${RESET}")"
}

do_logs() {
    if [ ! -f "$LOG_FILE" ]; then
        printf "${YELLOW}sem log ainda — inicie o servidor primeiro.${RESET}\n"
        return 1
    fi
    tail -f "$LOG_FILE"
}

case "${1:-}" in
    start)   do_start ;;
    stop)    do_stop ;;
    restart) do_restart ;;
    status)  title; do_status; line ;;
    logs)    do_logs ;;
    *)
        title
        printf "Uso: %s {start|stop|restart|status|logs}\n\n" "$0"
        printf "  ${BOLD}start${RESET}    liga Express (:%s) e Vite (:%s)\n" "$EXPRESS_PORT" "$VITE_PORT"
        printf "  ${BOLD}stop${RESET}     desliga tudo\n"
        printf "  ${BOLD}restart${RESET}  reinicia\n"
        printf "  ${BOLD}status${RESET}   mostra se está no ar\n"
        printf "  ${BOLD}logs${RESET}     acompanha o log ao vivo (Ctrl+C sai)\n"
        line
        exit 1
        ;;
esac
