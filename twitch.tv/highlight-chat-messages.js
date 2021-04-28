// ==UserScript==
// @name         [twitch.tv] - Highlight important messages in chat
// @namespace    https://github.com/wesermann/userscripts
// @version      0.5
// @description  Use color coding to highlight certain chat messages.
// @author       wesermann aka Xiithrian
// @match        https://www.twitch.tv/*
// @icon         https://www.google.com/s2/favicons?domain=twitch.tv
// @grant        none
// ==/UserScript==

(function() {
  'use strict'

  //* Color palette: https://coolors.co/ff1f1f-00bf00-3f003f-ff7f00-00ffff-df00df
  const colors = {
    author: {
      streamer:  "#FF1F1F", //* Red RYB.
      moderator: "#00BF00", //* Kelly Green.
      user:      "#3F003F", //* Russian Violet.
    },
    mention: {
      streamer:  "#FF7F00", //* Orange.
      chat:      "#00FFFF", //* Aqua.
      user:      "#DF00DF", //* Steel Pink.
    },
  }

  const streamer = window.channelName ?? document.referrer.split(".tv/")[1].split('?')[0]
  const user = document.cookie.split(';').filter(c => c.includes("name="))[0]?.split('=')[1]

  new MutationObserver(() => {
    document.querySelectorAll('.chat-line__message').forEach(node => {
      if (!node.parentNode.classList.contains("chat-scrollable-area__message-container")) {
        //* Ignore messages that are not a direct child of the `chat-scrollable-area__message-container`,
        //* which means messages already highlighted with channel points are not highlighted twice.
        return
      }

      const nodeCopy = node.cloneNode(true)

      //* Remove BTTV tooltips, because they might include the streamer's username.
      nodeCopy.querySelectorAll('.bttv-emote-tooltip').forEach(bttvTooltip => bttvTooltip.parentNode.removeChild(bttvTooltip))

      const message = nodeCopy.innerText.toLowerCase()

      if (hasBadge(node, "Broadcaster")) {
        node.style = style(colors.author.streamer)
      }
      else if (hasBadge(node, "Moderator")) {
        node.style = style(colors.author.moderator)
      }
      else if (message.includes(streamer)) {
        node.style = style(colors.mention.streamer)
      }
      else if (message.includes("chat")) {
        node.style = style(colors.mention.chat)
      }

      if (user) {
        if (sentBy(node, user)) {
          node.style = style(colors.author.user)
        }
        else if (message.includes(user)) {
          node.style = style(colors.mention.user)
        }
      }
    })
  }).observe(document.body, {childList: true, subtree: true})
})()

function style(color) {
  return `
            border: 1px solid #222;
            margin: -1px;
            background-color: ${color}3F;
            border-left: 6px solid ${color};
          `
}

function hasBadge(node, badgeName) {
  return node.querySelector(`img.chat-badge[alt="${badgeName}"]`)
}

function sentBy(node, user) {
  return node.querySelector("span.chat-author__display-name").attributes["data-a-user"].value === user
}
