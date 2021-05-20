// ==UserScript==
// @name         [twitch.tv] - Highlight important messages in chat
// @namespace    https://github.com/wesermann/userscripts
// @version      0.8,1
// @description  Use color coding to highlight certain chat messages.
// @author       wesermann aka Xiithrian
// @match        https://www.twitch.tv/*
// @icon         https://www.google.com/s2/favicons?domain=twitch.tv
// @grant        none
// ==/UserScript==

//? TODO: Add support for Admin badge.
//? TODO: Add support for Staff badge.

(async function() {
  'use strict'

  //& Color palette: https://coolors.co/ff1f1f-527652-00bf00-bfff00-3f003f-ff7f00-00ffff-df00df
  const colors = {
    author: {
      streamer:  "#FF1F1F", //* Red RYB.
      bot:       "#527652", //* Amazon.
      moderator: "#00BF00", //* Kelly Green.
      vip:       "#BFFF00", //* Bitter Lime.
      user:      "#3F003F", //* Russian Violet.
    },
    mention: {
      streamer:  "#FF7F00", //* Orange.
      chat:      "#00FFFF", //* Aqua.
      user:      "#DF00DF", //* Steel Pink.
    },
  }

  const streamer = window.channelName ?? location.pathname.replaceAll("/popout", "").split("/")[1]
  const user = document.cookie.split(';').filter(c => c.includes("name="))[0]?.split('=')[1]
  const bots = await getBots()

  new MutationObserver(() => {
    document.querySelectorAll('.chat-line__message').forEach(node => {
      if (!node.parentNode.classList.contains("chat-scrollable-area__message-container")) {
        //* Ignore messages that are not a direct child of the `chat-scrollable-area__message-container`,
        //* which means messages already highlighted with channel points are not highlighted twice.
        return
      }

      const nodeCopy = node.cloneNode(true)

      //* Remove emote tooltips, because they might include the streamer's username.
      nodeCopy.querySelectorAll('[class*=tooltip]').forEach(emoteTooltip => emoteTooltip.parentNode.removeChild(emoteTooltip))

      const message = nodeCopy.innerText.toLowerCase()

      if (hasBadge(node, "Broadcaster")) {
        //* Message sent by streamer.
        node.style = style(colors.author.streamer)
      }
      else if (bots.includes(getAuthor(node))) {
        //* Message sent by bot.
        node.style = style(colors.author.bot)
      }
      else if (hasBadge(node, "Moderator")) {
        //* Message sent by moderator.
        node.style = style(colors.author.moderator)
      }
      else if (hasBadge(node, "VIP")) {
        //* Message sent by VIP.
        node.style = style(colors.author.vip)
      }
      else if (message.includes(streamer)) {
        //* Message mentions streamer.
        node.style = style(colors.mention.streamer)
      }
      else if (message.includes("chat")) {
        //* Message mentions chat.
        node.style = style(colors.mention.chat)
      }

      if (user) {
        //^* You are logged in. If any of the rules below apply, they override the ones above.

        if (getAuthor(node) === user) {
          //* Message sent by you.
          node.style = style(colors.author.user)
        }

        else if (message.includes(user)) {
          //* Message mentions you.
          node.style = style(colors.mention.user)
        }
      }
    })
  }).observe(document.body, {childList: true, subtree: true})
})()

//^ Message highlight styling template.
function style(color) {
  return `
            border: 1px solid #222;
            margin: -1px;
            background-color: ${color}3F;
            border-left: 6px solid ${color};
          `
}

//^ Check if message author has a specific badge.
function hasBadge(node, badgeName) {
  return node.querySelector(`img.chat-badge[alt="${badgeName}"]`)
}

//^ Get the author of a message.
function getAuthor(node) {
  return node.querySelector("span.chat-author__display-name").attributes["data-a-user"].value
}

//^ Fetch known bots from `twitchbots.info` API.
function getBots() {
	return new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest()

		xhr.open('GET', 'https://api.twitchbots.info/v2/bot?limit=0', true)

		xhr.responseType = 'json'

		xhr.onload = () => {
			if (xhr.status == 200) {
				resolve(xhr.response.bots.map(bot => bot.username))
			}
			else {
				reject(xhr.status)
			}
		}

		xhr.send()
	})
}
