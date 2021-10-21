// ==UserScript==
// @name         [twitch.tv] - Highlight important messages in chat
// @namespace    https://github.com/wesermann/userscripts
// @version      0.8.2.6
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

  let streamer = document.querySelectorAll('.tw-halo')[0]?.getAttribute("href")?.replaceAll('/', '')
  if (!streamer) {
    streamer = window.channelName
        ?? document.querySelector('iframe.twitch-chat')?.id
        ?? location.pathname.replaceAll("/popout", "").replaceAll("/embed", "").split("/")[1]
  }
  streamer = streamer.toLowerCase()

  const user = document.cookie.split(';').filter(c => c.includes("login="))[0]?.split('=')[1].toLowerCase()

  console.log(`Highlight important messages in chat - enabled (streamer = ${streamer}, user = ${user})`)

  const bots = await getBots()

  new MutationObserver(() => {
    document.querySelectorAll('.chat-line__message, .vod-message').forEach(node => {
      // if (!node.parentNode.classList.contains("chat-scrollable-area__message-container")) {
      //   //* Ignore messages that are not a direct child of the `chat-scrollable-area__message-container`,
      //   //* which means messages already highlighted with channel points are not highlighted twice.
      //   return
      // }

      //^* Get message text, without the text from emote tooltips.

      let text = []

      const subnodes = node.querySelectorAll('[data-test-selector="chat-line-message-body"] :not([class*=tooltip], [class*=tooltip] *), .message  :not([class*=tooltip], [class*=tooltip] *)')

      subnodes.forEach(n => {
        let child = n.firstChild

        while (child) {
          if (child.nodeType == Node.TEXT_NODE) {
            text.push(child.data)
          }

          child = child.nextSibling
        }
      })

      const message = text.join('').toLowerCase()

      //^* Apply highlights.

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
  const badgeNameLowerCase = badgeName.toLowerCase()
  return node.querySelector(`span[data-badge="${badgeNameLowerCase}"]`)
      ?? node.querySelector(`img.chat-badge[alt="${badgeNameLowerCase}"]`)
}

//^ Get the author of a message.
function getAuthor(node) {
  const author = node.querySelector("span.chat-author__intl-login")?.innerText
      ?? node.querySelector("span.chat-author__display-name")?.innerText

  return author.replaceAll(' ', '').replaceAll('(', '').replaceAll(')', '').toLowerCase()
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
