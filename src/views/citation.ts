import { Notice, App, TFile, TAbstractFile, } from 'obsidian';
import { NotesMergerPluginSettingsType } from 'main';

export class Citation {
	label: string;
	settings: NotesMergerPluginSettingsType;

	constructor(label: string, settings: NotesMergerPluginSettingsType) {
		this.label = label;
		this.settings = settings;
	}

	parseRow(mark: string, rows: string[], value: string = '>') {
		if (rows.length <= 0)
			return "";

		const row = (rows.shift() as string).replace(value, "").trim();

		// skip optional row
		if (row === "-")
			return ""; 

		return row;
	}
}
