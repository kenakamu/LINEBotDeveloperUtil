/// <reference path="../node_modules/@types/jquery/index.d.ts" />

'use strict';
import * as vscode from 'vscode';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {

	let previewUri = vscode.Uri.parse('preview-line-message://authority/preview-line-message');

	class TextDocumentContentProvider implements vscode.TextDocumentContentProvider {
		private _onDidChange = new vscode.EventEmitter<vscode.Uri>();

		public provideTextDocumentContent(uri: vscode.Uri): string {
			return this.createLineSnippet();
		}

		get onDidChange(): vscode.Event<vscode.Uri> {
			return this._onDidChange.event;
		}

		public update(uri: vscode.Uri) {
			this._onDidChange.fire(uri);
		}

		private createLineSnippet() {
			let editor = vscode.window.activeTextEditor;
			if (!(editor.document.languageId === 'json')) {
				return this.errorSnippet("Active editor doesn't show a json document - no properties to preview.")
			}
			return this.extractSnippet();
		}

		private extractSnippet(): string {
			let editor = vscode.window.activeTextEditor;
			if (editor.selection.start.character !== editor.selection.end.character) {
				return this.snippetFromSelection(editor.document.getText(editor.selection));
			}
			let text = editor.document.getText();
			let selStart = editor.document.offsetAt(editor.selection.anchor);

			let propStart = text.lastIndexOf('{', selStart);
			let propEnd = text.indexOf('}', selStart);

			if (propStart === -1 || propEnd === -1) {
				return this.errorSnippet("Cannot determine the rule's properties.");
			} else {
				return this.snippet(editor.document, propStart, propEnd);
			}
		}

		private errorSnippet(error: string): string {
			return `
				<body>
					${error}
				</body>`;
		}

		private getPath(p: string): string {
			return path.join(context.extensionPath, p);
		}

		private snippet(document: vscode.TextDocument, propStart: number, propEnd: number): string {
			return this.snippetFromSelection(document.getText().slice(propStart, propEnd + 1));
		}

		private snippetFromSelection(selection: string): string {
			try {
				var data = JSON.parse(selection);
			}
			catch{
				return `
					<body>
						Please select entire JSON.
					</body>`;
			}

			var reply = parseDataAndReturnListItem(data);

			var cssPath = this.getPath("./css");
			var jsPath = this.getPath("./js");
			return `
			<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css">		
			<link rel="stylesheet" type="text/css" href="${cssPath}/site.css">
			<body>			
				<!-- LINE client simulator -->
				<div class="simulator">
					<div class="chat-area">
						<div class="chat-header">
							<div>
								<div class="col-xs-4">line
									<span>
										<i class="fa fa-wifi"></i>
									</span>
								</div>
								<div class="col-xs-4 time"></div>
								<div class="col-xs-4 icon-right">
									<span>
										<i class="fa fa-location-arrow header-icon"></i>
										<i class="fa fa-bluetooth-b header-icon"></i>
										<i class="fa fa-battery-2 header-icon"></i>
									</span>
								</div>
							</div>
							<div>
								<div class="col-xs-3 icon-left">
									<span>
										<i class="fa fa-angle-left fa-2x header-icon"></i>
									</span>
								</div>
								<div class="col-xs-6 bot-title">
									bot
								</div>
								<div class="col-xs-3 icon-right">
									<span>
										<i class="fa fa-home header-icon"></i>
										<i class="fa fa-angle-down fa-2x header-icon"></i>
									</span>
								</div>
							</div>
						</div>
						<div class="chat-thread">
							<!-- <ul class="chat-body"> -->
							<ul>
								<li class="chat-top-space"></li>            
								${reply}           
							</ul>
						</div>
						<div class="chat-box">
							<div class="chat-bar">
								<i class="fa fa-keyboard-o fa-inverse fa-lg" onclick="toggleKeyboard();"></i>
								<span class="fa-stack" onclick="toggleMoreMenu();">
									<i class="fa fa-square fa-stack-2x fa-inverse"></i>
									<i class="fa fa-angle-right fa-stack-1x"></i>
								</span>
								<span>
									<input type="text" class="chat-textarea" id="message-to-send" placeholder="Enter a message"></input>
								</span>
								<a onclick="sendFromChatBox()">
									<i class="fa fa-paper-plane fa-inverse"></i>
								</a>
							</div>
						</div>
						<div class="chat-keyboard">
							<img src="/img/keyboard.png" />
						</div>
						<!-- end chat-message -->
					</div>
				</div>
				<script src="https://use.fontawesome.com/3a3680e4e7.js"></script>
				<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js"></script>
			   	<script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js"></script>
			</body>`;
		}
	}

	let provider = new TextDocumentContentProvider();
	let registration = vscode.workspace.registerTextDocumentContentProvider('preview-line-message', provider);

	vscode.workspace.onDidChangeTextDocument((e: vscode.TextDocumentChangeEvent) => {
		if (e.document === vscode.window.activeTextEditor.document) {
			provider.update(previewUri);
		}
	});

	vscode.window.onDidChangeTextEditorSelection((e: vscode.TextEditorSelectionChangeEvent) => {
		if (e.textEditor === vscode.window.activeTextEditor) {
			provider.update(previewUri);
		}
	})

	let disposable = vscode.commands.registerCommand('extension.previewLineMessage', () => {
		return vscode.commands.executeCommand('vscode.previewHtml', previewUri, vscode.ViewColumn.Two, 'Preview LINE message').then((success) => {
		}, (reason) => {
			vscode.window.showErrorMessage(reason);
		});
	});

	context.subscriptions.push(disposable, registration);
}

// Parse LINE message object into HTML list item.
// tabindex attribute is neccesary to set focus on it for auto scroll to bottom.
export function parseDataAndReturnListItem(data) {
	if (data.type == "text") {
		var reply = `<li tabindex="1" class="chat-bot chat-text">${data.text}<span>${JSON.stringify(data)}</span></li>`;
	}
	else if (data.type == "sticker") {
		var reply = `<li tabindex="1" class="chat-bot chat-sticker">stickerId:<br/>${data.stickerId}</li>`;
	}
	else if (data.type == "image") {
		var reply = `<li tabindex="1" class="chat-bot chat-img"><img src="${data.previewImageUrl}"/></li>`;
	}
	else if (data.type == "video") {
		var reply = `<li tabindex="1" class="chat-bot chat-img">
				  <video controls autoplay>
					  <source src="${data.originalContentUrl}" type="video/mp4>
					</video>
			  </li>`
	}
	else if (data.type == "template") {
		if (data.template.type == "buttons") {
			var reply = `<li tabindex="1" class="chat-bot chat-template chat-template-buttons">`;
			if (data.template.thumbnailImageUrl) {
				reply += `<div class="chat-template-buttons-image" style="background-image:url(${data.template.thumbnailImageUrl})"></div>`;
			}
			if (data.template.title) {
				reply += `<div class="chat-template-buttons-title">${data.template.title}</div>`;
			}
			reply += `<div class="chat-template-buttons-text">${data.template.text}</div>`;
			for (let i = 0; i < data.template.actions.length; i++) {
				let action = data.template.actions[i];
				if (action.type == "postback") {
					if (action.text) {
						reply += `<div class="chat-template-buttons-button" onclick="{sendPostback('${action.data}');sendMessage('${action.text}');}">${action.label}</div>`;
					}
					else {
						reply += `<div class="chat-template-buttons-button" onclick="{sendMessage('${action.data}');}">${action.label}</div>`;
					}
				}
				else if (action.type == "message") {
					reply += `<div class="chat-template-buttons-button" onclick="{sendMessage('${action.text}');}">${action.text}</div>`;
				}
				else if (action.type == "uri") {
					reply += `<div class="chat-template-buttons-button"><a href="${action.uri}" target="_blank">${action.label}</a></div>`;
				}
			}
			reply += '</li>';
		}
		else if (data.template.type == "confirm") {
			var reply = `<li tabindex="1" class="chat-bot chat-template chat-template-confirm">
		  <div class="chat-template-confirm-text">${data.template.text}</div>
		  <div class="chat-template-confirm-yes" onclick="{sendMessage('${data.template.actions[0].text}');}">${data.template.actions[0].label}</div>
		  <div class="chat-template-confirm-no" onclick="{sendMessage('${data.template.actions[1].text}');}">${data.template.actions[1].label}</div>
		  </li>`;
		}
		else if (data.template.type == "carousel") {
			var reply = `<li class="chat-bot chat-icon-only"></li>
			<li tabindex="1" class="chat-template-carousel">`;
			for (let i = 0; i < data.template.columns.length; i++) {
				let column = data.template.columns[i];

				reply += `<div class="chat-template-buttons">`;
				if (column.thumbnailImageUrl) {
					reply += `<div class="chat-template-buttons-image" style="background-image:url(${column.thumbnailImageUrl})"></div>`;
				}
				if (column.title) {
					reply += `<div class="chat-template-buttons-title">${column.title}</div>`;
				}
				reply += `<div class="chat-template-buttons-text">${column.text}</div>`;
				for (let j = 0; j < column.actions.length; j++) {
					let action = column.actions[j];
					if (action.type == "postback") {
						if (action.text) {
							reply += `<div class="chat-template-buttons-button" onclick="{sendPostback('${action.data}');sendMessage('${action.text}');}">${action.label}</div>`;
						}
						else {
							reply += `<div class="chat-template-buttons-button" onclick="{sendMessage('${action.data}');}">${action.label}</div>`;
						}
					}
					else if (action.type == "message") {
						reply += `<div class="chat-template-buttons-button" onclick="{sendMessage('${action.text}');}">${action.text}</div>`;
					}
					else if (action.type == "uri") {
						reply += `<div class="chat-template-buttons-button"><a href="${action.uri}" target="_blank">${action.label}</a></div>`;
					}
				}
				reply += `</div>`;
			}

			reply += `</li>`;
		}
	}
	else if (data.type == "imagemap") {
		let imagemapId = Date.now();
		var reply = `<li tabindex="1" class="chat-imagemap">
		<img src="${data.baseUrl}/1040.png" alt="${data.altText}" usemap="#${imagemapId}"/><map name="${imagemapId}">`;

		for (let i = 0; i < data.actions.length; i++) {
			let action = data.actions[i];
			if (action.type === "uri") {
				reply += `<area shape="rect" coords="${action.area.x},${action.area.y},${action.area.width + action.area.x},${action.area.height}" href="${action.linkUri}" target="_blank">`;
			}
			else if (action.type === "message") {
				reply += `<area shape="rect" coords="${action.area.x},${action.area.y},${action.area.width + action.area.x},${action.area.height}" href="javascript:sendMessage('${action.text}');">`;
			}
		}
		reply += `</map></li>`;
	}
	return reply;
}

export function sendMessage(message) {
	// Craft LINE message
	let chatThread = $(".chat-thread ul");
	chatThread.append(`<li tabindex="1" class="chat-user chat-text");'>${message}</li>`);
	$('li').last().addClass('active-li').focus();
}
