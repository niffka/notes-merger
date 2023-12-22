import { Notice, App, TFile, TAbstractFile, } from 'obsidian';
import { GenerateMarkdownPluginSettingsType } from 'main';

export class Citation {
	label: string;
	settings: GenerateMarkdownPluginSettingsType;

	constructor(label: string, settings: GenerateMarkdownPluginSettingsType) {
		this.label = label;
		this.settings = settings;
	}
			
	parseRow(mark: string, rows: string[], value: string, optional = false) {
		const row = (rows.shift() as string).replace(value, "").trim();

		// required param is missing
		if (!optional && row.length <= 0) {
			new Notice(`${this.settings.literatureNote}:\nError compiling literature citations. \nRequired citation param "${mark}" is missing in "${this.label}"`);
			throw new Error(`${this.settings.literatureNote}:\nError compiling literature citations. \nRequired citation param "${mark}" is missing in "${this.label}"`);
		}

		// skip optional row
		if (row === "-")
			return ""; 

		return row;
	}
}
