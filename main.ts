import { App, Editor, MarkdownView, SuggestModal, Notice, Plugin, PluginSettingTab, Setting, getIconIds,setIcon ,getIcon, IconName, TFile } from 'obsidian';

// Remember to rename these classes and interfaces!

interface CalloutByTagSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: CalloutByTagSettings = {
	mySetting: 'default'
}

export default class CalloutByTag extends Plugin {
	settings: CalloutByTagSettings;

	async onload() {
		await this.loadSettings();
		await this.createCSSSnippet();
		this.registerEvent(
			this.app.workspace.on('editor-menu', (scroll, editor, view) => {
				scroll.addItem((item) => {
					item.setTitle('Insert Icon')
						.setIcon('copy-plus')
						.setSection('insert')
						.onClick(() => {
							new IconModal(this.app).open();
						});
				});
			}
		));
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'open-icon-modal',
			name: 'Open Icon Text Select',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new IconModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));

	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async createCSSSnippet() {
		const vault = this.app.vault.adapter;
		const path = '.obsidian/snippets/CalloutModularMarkdown.css';

		const colors = ['red', 'blue', 'green', 'cyan', 'yellow', 'purple', 'orange', 'pink'];

		interface Callout {
			[key: string]: [string[],string];
		}
		const baseCallouts:Callout = 
		{
			'bug':[['bug'], 'lucide-bug'], 
			'default':[['default', 'note'],'lucide-pencil'],
			'error':[['error', 'danger'], 'lucide-zap'],
			'example':[['example'], 'lucide-list'],
			'fail':[['fail', 'failure', 'missing'], 'lucide-x'],
			'important':[['important'],'lucide-flame'],
			'info':[['info'], 'lucide-info'],
			'question':[['question', 'help', 'faq'], 'lucide-circle-help'],
			'success':[['success', 'check','done'], 'lucide-check'],
			'summary':[['summary', 'abstract', 'tldr'], 'lucide-clipboard-list'],
			'tip':[['tip', 'hint'], 'lucide-flame'],
			'todo':[['todo'], 'lucide-circle-check'],
			'warning':[['warning', 'caution', 'attention'], 'lucide-triangle-alert'],
			'quote':[['quote', 'cite'], 'lucide-quote'],
		};

		await vault.write(path, `/* CSS Snippet for CalloutModularMarkdown Plugin */\n\n`);

		await vault.append(path, '/*Additional stylings for Callouts*/\n');
		vault.append(path, 
			`.callout[data-callout*=\"#darken\"] .callout-content{\n\tbackground-color: #00000020 !important;\n\tborder-radius: var(--callout-radius);\n}\n\n`
		);
		vault.append(path, 
			`.callout[data-callout*=\"#lighten\"] .callout-content{\n\tbackground-color: #FFFFFF20 !important;\n\tborder-radius: var(--callout-radius);\n}\n\n`
		);
		vault.append(path, 
			`.callout[data-callout*=\"#padding\"] .callout-content{\n\tpadding: var(--callout-padding)\n}\n\n`
		);

		await vault.append(path, '/*Stylings to fix base Callouts*/\n');
		Object.keys(baseCallouts).forEach(key => {
			const callout = baseCallouts[key];
			callout[0].forEach(tag => {
				vault.append(path, 
					`.callout[data-callout^=\"${tag}\"] {\n\t--callout-color: var(--callout-${key});\n\t--callout-icon: ${callout[1]};\n}\n\n`
				);
			});
		});

		await vault.append(path, '/*Stylings to change Callout Color*/\n');
		colors.forEach(color => {
			vault.append(path, 
				`.callout[data-callout^=\"${color}\"] {\n\t--callout-color: var(--color-${color}-rgb);\n}\n\n`
			);
		});

		await vault.append(path, '/*Stylings to change Callout Icon by using the iconId*/\n');
		getIconIds().forEach(iconId => {
			vault.append(path, 
				`.callout[data-callout*=\"#${iconId}\"] {\n\t--callout-icon: ${iconId};\n}\n\n`
			);
		});
	}
}

class IconModal extends SuggestModal<IconName> {
	constructor(app: App) {
		super(app);
		this.limit = 3000;
	}

	getSuggestions(query: string): IconName[] {
		// Filter icons based on the query string
		return getIconIds().filter((iconId) => iconId.toLowerCase().includes(query.toLowerCase()));
	}

	renderSuggestion(icon: IconName, el: HTMLElement): void {
		// Render the icon name and SVG in the suggestion list
		const suggestionEl = el.createEl('div', );
		setIcon(suggestionEl, icon);
		el.createEl('span', { text: icon});
		suggestionEl.style.display = 'inline-block';
		suggestionEl.style.marginRight = '8px';
	}

	onChooseSuggestion(icon: IconName, evt: MouseEvent | KeyboardEvent): void {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (view) {
			const cursor = view.editor.getCursor();
			view.editor.replaceRange(icon, cursor);
		}
		// You can also use the icon name directly if needed
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: CalloutByTag;

	constructor(app: App, plugin: CalloutByTag) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
	
}