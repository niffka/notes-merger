export default `
%%%%%%%%%%%%%%%%%%%%%%%% latexstyle.sty
%
%  Styl pro sazbu diplomovych praci pro XeLaTeX, v. 2.1
%  Freeware.
%  Omezeni: Pokud kdokoliv provede jakoukoliv modifikaci,
%           nesmi styl sirit pod stejnym jmenem.
%
%  Jiri Rybicka, 27. 4. 2019
%
%%%%%%%%%%%%%%%%%%%%%%%%
%
%  TEST SPRAVNOSTI KODOVANI (kodovani je UTF-8)
%  ---------------------------------------
%  Příliš žluťoučký kůň úpěl ďábelské ódy.
%  ---------------------------------------
%  Predchozi vetu musite videt spravne.
%
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%
% Historie:
%
% 27. 4. 2019 -- verze 2.1: 
%       a) změna sazby seznamu obrázků a tabulek
%       b) definice cleardoublepage -- nezobrazuje číslo stránky na prázdné straně
% 21. 3. 2019 -- verze 2.0, počáteční

\\usepackage{listings}


%%%%%%%%%%%%%%%%%%%%%% Vnořené styly

\\usepackage[no-math]{mathspec}
\\usepackage{graphicx, polyglossia, xltxtra, xcolor}

%%%%%%%%%%%%%%%%%%%%%% Rozměrové parametry

\\textwidth 150mm \\hoffset -5mm
\\textheight 220mm \\voffset -5mm
\\oddsidemargin 14mm
\\evensidemargin 6mm

\\tolerance 4000
\\widowpenalty 5000
\\clubpenalty 5000
\\raggedbottom

\\newlength\\intparindent
\\newlength\\intparskip
\\def\\technika{\\parindent=0pt \\parskip=0.5\\baselineskip plus 1pt}
\\def\\beletrie{\\parindent=2em \\parskip=0pt}

\\beletrie % implicitně
%%%%%%%%%%%%%%%%%%%%%% Fonty

\\def\\pismo#1{\\csname f@#1\\endcsname}

\\def\\f@LModern{} % Latin Modern je implicitně
\\def\\f@Academica{\\setprimaryfont{Academica Text Pro}\\setallsansfonts{Tahoma}\\setmonofont[Scale=0.9]{Consolas}}
\\def\\f@Baskerville{\\setprimaryfont{Baskerville 10 Pro}\\setallsansfonts{John Sans Text Pro}\\setmonofont[Scale=0.9]{Consolas}}
\\def\\f@Bookman{\\setprimaryfont{TeX Gyre Bonum}\\setallsansfonts{Verdana}%
		\\setmonofont[Scale=0.9]{TeX Gyre Cursor}[FakeBold=1.5]}
\\def\\f@Cambria{\\setprimaryfont{Cambria}\\setallsansfonts{Calibri}\\setmonofont[Scale=0.9]{Consolas}}
\\def\\f@Comenia{\\setprimaryfont{Comenia Serif Pro}\\setallsansfonts{Candara}\\setmonofont[Scale=0.9]{Consolas}}
\\def\\f@Constantia{\\setprimaryfont{Constantia}\\setallsansfonts{Candara}\\setmonofont[Scale=0.9]{Consolas}}
\\def\\f@Palatino{\\setprimaryfont{TeX Gyre Pagella}\\setallsansfonts{TeX Gyre Heros}%
		\\setmonofont[Scale=0.9]{Consolas}}
\\def\\f@Times{\\setprimaryfont{TeX Gyre Termes}\\setallsansfonts{TeX Gyre Heros}%
		\\setmonofont[Scale=0.8]{TeX Gyre Cursor}[FakeBold=1.5]}

\\defaultfontfeatures{Mapping=tex-text}

\\def\\jedenfont{\\let\\doplsanserif\\relax}
\\def\\dvafonty{\\let\\doplsanserif\\sffamily}

\\jedenfont % implicitně

\\def\\markfont{\\normalfont\\footnotesize\\doplsanserif}
\\def\\pgfont{\\normalfont\\bfseries\\doplsanserif}

%%%%%%%%%%%%%%%%%%%%%% Stránkování

\\def\\ps@headings{%
		\\def\\@oddfoot{}%
		\\def\\@evenfoot{}%
		\\let\\@mkboth\\markboth
		\\def\\@evenhead{\\parbox{\\textwidth}{{\\pgfont \\thepage}
				\\hfill{\\markfont \\leftmark}\\smallskip\\hrule}}%
		\\def\\@oddhead{\\parbox{\\textwidth}{{\\markfont
		\\rightmark}\\hfill{\\pgfont \\thepage}\\smallskip\\hrule}}}

\\def\\ps@plain{%
		\\def\\@oddhead{}%
		\\def\\@evenhead{}%
		\\def\\@evenfoot{\\parbox{\\textwidth}{\\pgfont \\thepage}}%
		\\def\\@oddfoot{\\parbox{\\textwidth}{\\hspace*{\\fill}
					{\\pgfont \\thepage}}}}

\\def\\ps@empty{\\def\\@oddhead{}%
				\\def\\@evenhead{}%
				\\def\\@oddfoot{}%
				\\def\\@evenfoot{}%
				}
\\def\\ps@notext{%
		\\def\\@oddfoot{}%
		\\def\\@evenfoot{}%
		\\def\\@evenhead{}%
		\\def\\@oddhead{\\parbox{\\textwidth}{{Seznam použitých zkratek}\\hfill{\\pgfont \\thepage}\\smallskip\\hrule}}}

\\pagestyle{headings}   % implicitně

\\def\\cleardoublepage{\\clearpage\\thispagestyle{empty}\\if@twoside \\ifodd\\c@page\\else
	\\hbox{}\\newpage\\if@twocolumn\\hbox{}\\newpage\\fi\\fi\\fi}

%%%%%%%%%%%%%%%%%%%%%% Jazyky
\\setmainlanguage{czech}
\\setotherlanguage{slovak}
\\setotherlanguage{english}

\\def\\cestina{\\gdef\\@jazyk{c}\\selectlanguage{czech}}
\\def\\slovencina{\\gdef\\@jazyk{s}\\selectlanguage{slovak}}
\\def\\english{\\gdef\\@jazyk{a}\\selectlanguage{english}\\let\\uv\\enguv}

\\def\\lokcestina{\\def\\@jazyk{c}\\selectlanguage{czech}}
\\def\\lokslovencina{\\def\\@jazyk{s}\\selectlanguage{slovak}}
\\def\\lokenglish{\\def\\@jazyk{a}\\selectlanguage{english}\\let\\uv\\enguv}

\\def\\@nastavjazyk{\\if c\\@jazyk\\selectlanguage{czech}\\fi
				\\if s\\@jazyk\\selectlanguage{slovak}\\fi
				\\if a\\@jazyk\\selectlanguage{english}\\fi}

\\cestina % implicitně

\\def\\lgtxt#1{\\if c\\@jazyk\\csname c@#1\\endcsname\\fi
				\\if s\\@jazyk\\csname s@#1\\endcsname\\fi
				\\if a\\@jazyk\\csname a@#1\\endcsname\\fi}

%%%%%%%%%%%%%%%%%%%%%% Úvodní stránky

\\def\\typprace{\\lgtxt{Bakalarska}} % implicitní nastavení
\\def\\bakalarska{\\gdef\\typprace{\\lgtxt{Bakalarska}}}
\\def\\diplomova{\\gdef\\typprace{\\lgtxt{Diplomova}}}
\\def\\disertacni{\\gdef\\typprace{\\lgtxt{Disertacni}}}
\\def\\vedecky{\\gdef\\typprace{\\lgtxt{Vedecky}}}
\\def\\skola#1{\\gdef\\@skola{#1}}
\\def\\fakulta#1{\\gdef\\@fakulta{#1}}

\\def\\titul#1#2#3#4{\\thispagestyle{empty}%
	\\@nastavjazyk
	\\vspace*{-20mm}
	\\begin{center}
	{\\Large \\doplsanserif \\@skola\\\\[8pt]}
	{\\Large \\doplsanserif \\@fakulta} \\par \\bigskip \\hrule
	\\vbox to 165mm{\\vspace*{\\fill}
	{\\Huge\\doplsanserif\\bfseries #1\\par}\\vskip 10mm
	{\\large\\doplsanserif\\bfseries \\typprace{} } \\par
	\\vspace*{\\fill}}\\par
	\\noindent {\\large \\doplsanserif
		\\begin{tabular}{@{}l}
		\\lgtxt{Vedprace}:\\\\ #3\\end{tabular} \\hfill #2}
	\\par \\vfill {\\large \\doplsanserif #4}\\end{center}%
	\\gdef\\@nazprace{#1}%
}

\\skola{\\lgtxt{Mendelka}}
\\fakulta{\\lgtxt{Pefka}}

\\def\\prohlaseni#1#2{\\cleardoublepage\\thispagestyle{empty}\\vspace*{\\fill}\\noindent
		\\parbox{\\textwidth}{\\hspace*{\\parindent}#1 \\\\[15mm]
		#2 \\hfill \\hbox to 60mm{\\tiny\\dotfill}}}

\\def\\prohlasenizena#1{\\cleardoublepage\\intparindent=\\parindent\\intparskip=\\parskip
		\\thispagestyle{empty}\\vspace*{\\fill}\\noindent
		\\parbox{\\textwidth}{\\doplsanserif\\bfseries \\lgtxt{Cprohlas}}\\par\\medskip
		\\noindent\\lgtxt{Prohltextzena}\\\\[15mm]
		#1 \\hfill \\begin{tabular}[t]{c@{}}\\hbox to 60mm{\\tiny\\dotfill}\\\\
					\\footnotesize\\lgtxt{podpis}\\end{tabular}}

\\def\\prohlasenimuz#1{\\cleardoublepage\\intparindent=\\parindent\\intparskip=\\parskip
		\\thispagestyle{empty}\\vspace*{\\fill}\\noindent
		\\parbox{\\textwidth}{\\doplsanserif\\bfseries \\lgtxt{Cprohlas}}\\par\\medskip
		\\noindent\\lgtxt{Prohltextmuz}\\\\[15mm]
		#1 \\hfill \\begin{tabular}[t]{c@{}}\\hbox to 60mm{\\tiny\\dotfill}\\\\
					\\footnotesize\\lgtxt{podpis}\\end{tabular}}

\\def\\podekovani#1{\\cleardoublepage\\thispagestyle{empty}\\vspace*{\\fill}%
		\\noindent\\parbox{\\textwidth}{{\\doplsanserif\\bfseries \\lgtxt{Podekovani}}\\par\\medskip
		#1}}

\\def\\abstract#1#2{\\gdef\\@enabstraktdata{#1}\\gdef\\@enabstrakttext{#2}}
\\def\\abstrakt#1#2{\\gdef\\@csabstraktdata{#1}\\gdef\\@csabstrakttext{#2}}

\\def\\klslova#1{\\gdef\\@csklslova{#1}}
\\def\\keywords#1{\\gdef\\@enklslova{#1}}

\\abstract..
\\abstrakt..
\\klslova. % implicitně jen tečka, která se testuje na přítomnost obsahu
\\keywords.

\\def\\@vypisabstrakty{\\cleardoublepage\\vspace*{5mm}%
		\\if a\\@jazyk
			{\\lokcestina\\noindent {\\doplsanserif\\bfseries Abstrakt}\\par\\medskip
			\\noindent \\@csabstraktdata\\par\\medskip\\noindent\\@csabstrakttext
			\\if .\\@csklslova\\else \\par\\medskip\\noindent
				{\\doplsanserif\\bfseries\\lgtxt{Klslova}:} \\@csklslova
			\\fi
			}
			\\par\\vspace{2cm}%
			\\noindent {\\doplsanserif\\bfseries Abstract}\\par\\medskip
			\\noindent \\@enabstraktdata\\par\\medskip\\noindent\\@enabstrakttext
			\\if .\\@enklslova\\else \\par\\medskip\\noindent
				{\\doplsanserif\\bfseries\\lgtxt{Klslova}:} \\@enklslova
			\\fi
		\\else
			{\\lokenglish
			\\noindent {\\doplsanserif\\bfseries Abstract}\\par\\medskip
			\\noindent \\@enabstraktdata\\par\\medskip\\noindent\\@enabstrakttext
			\\if .\\@enklslova\\else \\par\\medskip\\noindent
				{\\doplsanserif\\bfseries\\lgtxt{Klslova}:} \\@enklslova
			\\fi}
			\\par\\vspace{2cm}%
			\\noindent {\\doplsanserif\\bfseries Abstrakt}\\par\\medskip
			\\noindent \\@csabstraktdata\\par\\medskip\\noindent\\@csabstrakttext
			\\if .\\@csklslova\\else \\par\\medskip\\noindent
				{\\doplsanserif\\bfseries\\lgtxt{Klslova}:} \\@csklslova
			\\fi
		\\fi}

%%%%%%%%%%%%%%%%%%%%%% Obsah

\\def\\obsah{\\@vypisabstrakty\\cleardoublepage\\tableofcontents\\cleardoublepage}

\\def\\l@obrtab#1#2{\\addpenalty{\\@secpenalty}% good place for page break
	\\addvspace{0.2em plus\\p@}%
	\\@tempdima 1.5em
	\\begingroup
		\\parindent \\z@ \\rightskip \\@pnumwidth plus 1in
		\\parfillskip -\\@pnumwidth
		\\leavevmode
		\\advance\\leftskip\\@tempdima
		\\hskip -\\leftskip
		#1\\nobreak
		\\xleaders\\hbox{$\\m@th
		\\mkern \\@dotsep mu\\hbox{.}\\mkern \\@dotsep
		mu$}\\hfill\\nobreak\\hbox to\\@pnumwidth{\\hss #2}\\par
	\\endgroup}

%%%%%%%%%%%%%%%%%%%%%% Oddíly v textu

\\def\\cislovat#1{\\setcounter{secnumdepth}{#1}\\setcounter{tocdepth}{#1}}

\\renewcommand\\section{\\@startsection {section}{1}{\\z@}%
					{-3.5ex \\@plus -1ex \\@minus -.2ex}%
					{2.3ex \\@plus.2ex}%
					{\\normalfont\\doplsanserif\\Large\\bfseries}}
\\renewcommand\\subsection{\\@startsection{subsection}{2}{\\z@}%
					{-3.25ex\\@plus -1ex \\@minus -.2ex}%
					{1.5ex \\@plus .2ex}%
					{\\normalfont\\doplsanserif\\large\\bfseries}}
\\renewcommand\\subsubsection{\\@startsection{subsubsection}{3}{\\z@}%
					{-3.25ex\\@plus -1ex \\@minus -.2ex}%
					{1.5ex \\@plus .2ex}%
					{\\normalfont\\normalsize\\doplsanserif\\bfseries}}
\\renewcommand\\paragraph{\\@startsection{paragraph}{4}{\\z@}%
					{3.25ex \\@plus1ex \\@minus.2ex}%
					{-1em}%
					{\\normalfont\\normalsize\\doplsanserif\\bfseries}}
\\renewcommand\\subparagraph{\\@startsection{subparagraph}{5}{\\parindent}%
					{3.25ex \\@plus1ex \\@minus .2ex}%
					{-1em}%
					{\\normalfont\\normalsize\\doplsanserif\\bfseries}}


\\renewcommand\\lstlistingname{Seznam kódů} % předefinování nadpisu
\\renewcommand\\lstlistlistingname{Seznam kódů} % předefinování nadpisu v obsahu
% \\newcommand\\listequationsname{Seznam rovnic}

\\def\\kapitola#1{\\clearpage\\section{#1}
		\\markboth{\\thesection\\quad \\uppercase{#1}}{\\thesection\\quad
								\\uppercase{#1}}}
\\def\\sekce#1{\\subsection{#1}\\markright{\\thesubsection\\quad #1}}
\\def\\podsekce#1{\\subsubsection{#1}}

\\def\\appname{\\lgtxt{Prilohy}}

\\def\\@samstranapriloh{\\clearpage\\thispagestyle{empty}
		\\vspace*{50mm}\\begin{center}
		\\normalfont\\doplsanserif\\LARGE\\bfseries
					\\uppercase{\\appname}\\end{center}
		\\addcontentsline{toc}{section}{\\appname}
}

\\def\\prilohy{\\@ifnextchar*{\\@prilohy{}}{\\@prilohy{\\@samstranapriloh}}}

\\def\\@prilohy#1{#1
		\\def\\thesection{\\Alph{section}}\\setcounter{section}{0}}
\\let\\priloha\\kapitola


%%%%%%%%%%%%%%%%%%%%%% Literatura

\\def\\refname#1{\\gdef\\@nadpliter{#1}}
\\gdef\\@nadpliter{\\lgtxt{Literatura}}

\\renewenvironment{thebibliography}[1]
		{\\section{\\@nadpliter}%
		\\markboth{\\thesection\\quad \\uppercase{\\@nadpliter}}{\\thesection\\quad
									\\uppercase{\\@nadpliter}}%
		\\list{\\@biblabel{\\@arabic\\c@enumiv}}%
			{\\settowidth\\labelwidth{\\@biblabel{#1}}%
			\\itemindent -2em
			\\leftmargin 2em
			\\raggedright
			\\@openbib@code
			%\\usecounter{enumiv}%
			\\let\\p@enumiv\\@empty
			\\renewcommand\\theenumiv{\\@arabic\\c@enumiv}}%
		\\sloppy
		\\clubpenalty4000
		\\@clubpenalty \\clubpenalty
		\\widowpenalty4000%
		\\sfcode\`\\.\\@m}

\\def\\@citex[#1]#2{%
	\\let\\@citea\\@empty
	\\@cite{\\@for\\@citeb:=#2\\do
	{\\@citea\\def\\@citea{; }%
		\\edef\\@citeb{\\expandafter\\@firstofone\\@citeb}%
		\\if@filesw\\immediate\\write\\@auxout{\\string\\citation{\\@citeb}}\\fi
		\\@ifundefined{b@\\@citeb}{\\mbox{\\reset@font\\bfseries ?}%
		\\G@refundefinedtrue
		\\@latex@warning
			{Citation \`\\@citeb' on page \\thepage \\space undefined}}%
		{\\hbox{\\csname b@\\@citeb\\endcsname}}}}{#1}}

\\def\\@lbibitem[#1]#2{\\item []\\if@filesw
		{\\let\\protect\\noexpand
		\\immediate
		\\write\\@auxout{\\string\\bibcite{#2}{#1}}}\\fi\\ignorespaces}

\\def\\@cite#1#2{({\\let\\hbox\\relax #1\\if@tempswa , #2\\fi})}

\\def\\autor#1{\\textsc{#1}}
\\def\\nazev#1{\\textit{#1}}
\\def\\akol{\\rm}

\\newenvironment{literatura}{\\newpage\\begin{thebibliography}{}}%
				{\\end{thebibliography}}

\\def\\citace#1#2#3{% ident., tvar odkazu, údaje
\\bibitem [#2]{#1} #3.
}

%%%%%%%%%%%%%%%%%%%%%% Výčty a seznamy
\\newdimen\\leftmargini
\\newdimen\\leftmarginii
\\newdimen\\leftmarginiii
\\newdimen\\leftmarginiv
\\newdimen\\leftmarginv
\\newdimen\\leftmarginvi
\\leftmargini=2em
\\leftmarginii=2em
\\leftmarginiii=2em
\\leftmarginiv=2em
\\leftmarginv=2em
\\leftmarginvi=2em

\\def\\@listi{\\leftmargin\\leftmargini
			\\parsep 0pt %\\parskip% 4\\p@ \\@plus2\\p@ \\@minus\\p@
			\\topsep 0.5\\baselineskip%\\parskip% 8\\p@ \\@plus2\\p@ \\@minus4\\p@
			\\itemsep 0.5\\baselineskip}%\\parskip}% 4\\p@ \\@plus2\\p@ \\@minus\\p@}
\\let\\@listI\\@listi
\\@listi
\\def\\@listii {\\leftmargin\\leftmarginii
				\\labelwidth\\leftmarginii
				\\advance\\labelwidth-\\labelsep
				\\topsep   0.5\\baselineskip%\\parskip%  4\\p@ \\@plus2\\p@ \\@minus\\p@
				\\parsep   0pt %\\parskip%  2\\p@ \\@plus\\p@  \\@minus\\p@
				\\itemsep   0.5\\baselineskip}%\\parsep}

\\def\\labelenumii{\\theenumii)}

\\def\\@listiii{\\leftmargin\\leftmarginiii
				\\labelwidth\\leftmarginiii
				\\advance\\labelwidth-\\labelsep
				\\topsep   0.5\\baselineskip%\\parskip%  2\\p@ \\@plus\\p@\\@minus\\p@
				\\parsep   0pt %\\parskip%  \\z@
				\\partopsep\\parskip%  \\p@ \\@plus\\z@ \\@minus\\p@
				\\itemsep   0.5\\baselineskip}%\\topsep}
\\def\\@listiv {\\leftmargin\\leftmarginiv
				\\labelwidth\\leftmarginiv
				\\advance\\labelwidth-\\labelsep}
\\def\\@listv  {\\leftmargin\\leftmarginv
				\\labelwidth\\leftmarginv
				\\advance\\labelwidth-\\labelsep}
\\def\\@listvi {\\leftmargin\\leftmarginvi
				\\labelwidth\\leftmarginvi
				\\advance\\labelwidth-\\labelsep}

%%%%%%%%%%%%%%%%%%%%%% Plovoucí prostředí

\\def\\figurename#1{\\gdef\\@nazobr{#1}}
\\def\\tablename#1{\\gdef\\@naztab{#1}}

\\def\\popisky{\\gdef\\@nazobr{\\lgtxt{Obrazek}}\\gdef\\@naztab{\\lgtxt{Tabulka}}}
\\def\\popiskyzkr{\\gdef\\@nazobr{\\lgtxt{Obr}}\\gdef\\@naztab{\\lgtxt{Tab}}}

\\popisky % implicitně

\\def\\csfigcap#1{\\refstepcounter{figure}\\parbox{\\textwidth}{\\small\\raggedright%
		\\@nazobr{} \\thefigure: #1}\\addcontentsline{lof}{obrtab}{\\figurename{} 
		\\thefigure: #1}}

\\def\\obrzdroj#1{\\newline\\textit{\\lgtxt{Zdroj}:} #1}

\\def\\csfigcapbez{\\refstepcounter{figure}\\parbox{\\textwidth}{\\small%
		\\@nazobr{} \\thefigure}\\addcontentsline{lof}{obrtab}{\\figurename{} 
		\\thefigure}}

\\def\\cstabcap#1{\\refstepcounter{table}\\parbox{\\textwidth}{\\small\\raggedright%
		\\@naztab{} \\thetable: #1}\\addcontentsline{lot}{obrtab}{\\tablename{} 
		\\thetable: #1}}

\\def\\cstabcapbez{\\refstepcounter{table}\\parbox{\\textwidth}{\\small%
		\\@naztab{} \\thetable}\\addcontentsline{lot}{obrtab}{\\tablename{} 
		\\thetable}}
		
\\def\\tabzdroj#1{\\par\\medskip\\parbox{\\textwidth}{\\small\\textit{\\lgtxt{Zdroj}:} #1}}       

\\newif\\ifjedraft\\jedraftfalse
\\def\\draft{\\jedrafttrue}
\\def\\obrazek{\\begin{figure}[htb]\\centering }
\\def\\obrazekp{\\begin{figure}[p]\\centering }
\\def\\endobr#1{\\par\\medskip\\csfigcap{#1}\\end{figure}}
\\def\\endobrl#1#2{\\par\\medskip\\csfigcap{#1}\\label{#2}\\end{figure}}
\\def\\endobrbez{\\par\\medskip\\csfigcapbez\\end{figure}}
% \\def\\vloztif#1{\\ifjedraft\\else\\input #1 \\csname set#1\\endcsname\\fi}
\\def\\vlozobr#1#2{\\ifjedraft \\scalebox{#2}{\\includegraphics[draft]{#1}}
		\\else\\scalebox{#2}{\\includegraphics{#1}}\\fi}
\\def\\vlozobrbox#1#2#3{\\ifjedraft\\resizebox{#2}{#3}{\\includegraphics[draft]{#1}}
		\\else\\resizebox{#2}{#3}{\\includegraphics{#1}}\\fi}

\\def\\tabulka#1{\\begin{table}[htb]\\centering\\cstabcap{#1}\\par\\medskip}
\\def\\tabulkap#1{\\begin{table}[p]\\centering\\cstabcap{#1}\\par\\medskip}
\\def\\endtab{\\end{table}}

\\def\\pole#1#2{{\\def\\arraystretch{.95}\\begin{tabular}{@{}#1@{}}
					#2\\end{tabular}}}

\\def\\polet#1#2{{\\def\\arraystretch{.95}\\begin{tabular}[t]{@{}#1@{}}
					#2\\end{tabular}}}

{\\catcode\`\\!=\\active
\\gdef\\vykricnik{\\catcode\`\\!=\\active \\def!{\\hphantom{0}}}
}

%%%%%%%%%%%%%%%%%%%%%% Speciální znaky

\\def\\spoj{\\discretionary{-}{-}{-}}
\\def\\az{\\discretionary{}{\\hbox{až\\ }}{--}}
\\def\\uvv#1{»#1«}
\\def\\uv#1{„#1“}
\\def\\enguv#1{“#1”}
\\def\\,{\\penalty10000\\hskip0.25em}
\\def\\;{\\penalty10000\\hskip0.16666em}

%%%%%%%%%%%%%%%%%%%%%% Jazykové řetězce

\\def\\c@Diplomova{Diplomová práce}
\\def\\s@Diplomova{Diplomová práca}
\\def\\a@Diplomova{Diploma thesis}

\\def\\c@Bakalarska{Bakalářská práce}
\\def\\s@Bakalarska{Bakalárska práca}
\\def\\a@Bakalarska{Bachelor thesis}

\\def\\c@Disertacni{Disertační práce}
\\def\\s@Disertacni{Dizertačná práca}
\\def\\a@Disertacni{Dissertation thesis}


\\def\\c@Vedecky{Vědecký článek}
\\def\\s@Vedecky{Vedecký článok}
\\def\\a@Vedecky{Scientific article}

\\def\\c@prace{práce}
\\def\\s@prace{práca}
\\def\\a@prace{thesis}

\\def\\c@Mendelka{Mendelova univerzita v~Brně}
\\def\\s@Mendelka{Mendelova univerzita v~Brne}
\\def\\a@Mendelka{Mendel University in Brno}

\\def\\c@Pefka{Provozně ekonomická fakulta}
\\def\\s@Pefka{Prevádzkovo ekonomická fakulta}
\\def\\a@Pefka{Faculty of Business and Economy}

\\def\\c@Vedprace{Vedoucí práce}
\\def\\s@Vedprace{Vedúci práce}
\\def\\a@Vedprace{Supervisor}

\\def\\c@Prilohy{Přílohy}
\\def\\s@Prilohy{Prílohy}
\\def\\a@Prilohy{Appendices}

\\def\\c@Podekovani{Poděkování}
\\def\\s@Podekovani{Poďakovanie}
\\def\\a@Podekovani{Acknowledgment}

\\def\\c@Cprohlas{Čestné prohlášení}
\\def\\s@Cprohlas{Čestné prehlásenie}
\\def\\a@Cprohlas{Declaration}

\\def\\c@Prohltextzena{Prohlašuji, že jsem práci {\\bfseries \\@nazprace}
		vypracovala samostatně a~veškeré použité prameny a~informace uvádím 
		v~seznamu použité literatury. Souhlasím, aby moje práce byla zveřejněna 
		v~souladu s~§\\,47b zákona č.\\,111/1998 Sb., o~vysokých školách ve znění 
		pozdějších předpisů a~v~souladu s~platnou Směrnicí o~zveřejňování 
		závěrečných prací.\\par
		\\vskip\\intparskip Jsem si vědoma, že se na moji práci vztahuje zákon 
		č.\\,121/2000 Sb., autorský zákon, a~že Mendelova univerzita v~Brně má 
		právo na uzavření licenční smlouvy a~užití této práce jako školního díla 
		podle §\\,60 odst.\\,1 autorského zákona.\\par
		\\vskip\\intparskip Dále se zavazuji, že před sepsáním licenční smlouvy 
		o~využití díla jinou osobou (subjektem) si vyžádám písemné stanovisko 
		univerzity, že předmětná licenční smlouva není v~rozporu s~oprávněnými 
		zájmy univerzity, a~zavazuji se uhradit případný příspěvek na úhradu 
		nákladů spojených se vznikem díla, a~to až do jejich skutečné výše.
}
\\def\\s@Prohltextzena{Prehlasujem, že som prácu {\\bfseries \\@nazprace}
		vypracovala samostatne a~všetky použité zdroje a~informácie uvádzam 
		v~zozname použitej literatúry. Súhlasím, aby moja práca bola zverejnená 
		v~súlade s~§\\,47b zákona č.\\,111/1998 Zb., o~vysokých školách v~znení 
		neskorších predpisov a~v~súlade s~platnou \\textit{Směrnicí o~zveřejňování 
		závěrečných prací}.\\par
		\\vskip\\intparskip Som si vedomá, že sa na moju prácu vzťahuje zákon 
		č.\\,121/2000 Zb., autorský zákon, a~že Mendelova univerzita v~Brne má 
		právo na uzatvorenie licenčnej zmluvy a~použitie tejto práce ako školského 
		diela podľa §\\,60 odst.\\,1 autorského zákona.\\par
		\\vskip\\intparskip Ďalej sa zaväzujem, že pred spísaním licenčnej zmluvy 
		o~použití diela inou osobou (subjektom) si vyžiadam písomné stanovisko 
		univerzity, že predmetná licenčná zmluva nie je v rozpore s~oprávnenými 
		záujmami univerzity a~zaväzujem sa uhradiť prípadný príspevok na úhradu 
		nákladov spojených so vznikom diela, a~to až do ich skutočnej výšky.
}
\\def\\a@Prohltextzena{I hereby declare that this thesis entitled 
		{\\bfseries \\@nazprace} was written and completed by me. I also declare 
		that all the sources and information used to complete the thesis are 
		included in the list of references. I~agree that the thesis could be 
		made public in accordance with Article 47b of Act No.\\,111/1998 Coll., 
		Higher Education Institutions and on Amendments and Supplements to Some 
		Other Acts (the Higher Education Act), and in accordance with the current 
		Directive on publishing of the final thesis.\\par
		\\vskip\\intparskip I am aware that my thesis is written in accordance to 
		Act No.\\,121/2000 Coll., on Copyright and therefore Mendel University 
		in Brno has the right to conclude licence agreements on the utilization 
		of the thesis as a~school work in accordance with Article 60(1) of the 
		Copyright Act.\\par
		\\vskip\\intparskip Before concluding a~licence agreement on utilization of 
		the work by another person, I will request a written statement from the 
		university that the licence agreement is not in contradiction to 
		legitimate interests of the university, and I will also pay a~prospective 
		fee to cover the cost incurred in creating the work to the full amount of 
		such costs.
}

\\def\\c@Prohltextmuz{Prohlašuji, že jsem práci {\\bfseries \\@nazprace}
		vypracoval samostatně a~veškeré použité prameny a~informace uvádím 
		v~seznamu použité literatury. Souhlasím, aby moje práce byla zveřejněna 
		v~souladu s~§\\,47b zákona č.\\,111/1998 Sb., o~vysokých školách ve znění 
		pozdějších předpisů a~v~souladu s~platnou Směrnicí o~zveřejňování 
		závěrečných prací.\\par
		\\vskip\\intparskip Jsem si vědom, že se na moji práci vztahuje zákon 
		č.\\,121/2000 Sb., autorský zákon, a~že Mendelova univerzita v~Brně má 
		právo na uzavření licenční smlouvy a~užití této práce jako školního díla 
		podle §\\,60 odst.\\,1 autorského zákona.\\par
		\\vskip\\intparskip Dále se zavazuji, že před sepsáním licenční smlouvy 
		o~využití díla jinou osobou (subjektem) si vyžádám písemné stanovisko 
		univerzity, že předmětná licenční smlouva není v~rozporu s~oprávněnými 
		zájmy univerzity, a~zavazuji se uhradit případný příspěvek na úhradu 
		nákladů spojených se vznikem díla, a~to až do jejich skutečné výše.
}
\\def\\s@Prohltextmuz{Prehlasujem, že som prácu {\\bfseries \\@nazprace}
		vypracoval samostatne a~všetky použité zdroje a~informácie uvádzam 
		v~zozname použitej literatúry. Súhlasím, aby moja práca bola zverejnená 
		v~súlade s~§\\,47b zákona č.\\,111/1998 Zb., o~vysokých školách v~znení 
		neskorších predpisov a~v~súlade s~platnou \\textit{Směrnicí o~zveřejňování 
		závěrečných prací}.\\par
		\\vskip\\intparskip Som si vedomý, že sa na moju prácu vzťahuje zákon 
		č.\\,121/2000 Zb., autorský zákon, a~že Mendelova univerzita v~Brne má 
		právo na uzatvorenie licenčnej zmluvy a~použitie tejto práce ako školského 
		diela podľa §\\,60 odst.\\,1 autorského zákona.\\par
		\\vskip\\intparskip Ďalej sa zaväzujem, že pred spísaním licenčnej zmluvy 
		o~použití diela inou osobou (subjektom) si vyžiadam písomné stanovisko 
		univerzity, že predmetná licenčná zmluva nie je v rozpore s~oprávnenými 
		záujmami univerzity a~zaväzujem sa uhradiť prípadný príspevok na úhradu 
		nákladov spojených so vznikom diela, a~to až do ich skutočnej výšky.
}
\\def\\a@Prohltextmuz{I hereby declare that this thesis entitled 
		{\\bfseries \\@nazprace} was written and completed by me. I also declare 
		that all the sources and information used to complete the thesis are 
		included in the list of references. I~agree that the thesis could be 
		made public in accordance with Article 47b of Act No.\\,111/1998 Coll., 
		Higher Education Institutions and on Amendments and Supplements to Some 
		Other Acts (the Higher Education Act), and in accordance with the current 
		Directive on publishing of the final thesis.\\par
		\\vskip\\intparskip I am aware that my thesis is written in accordance to 
		Act No.\\,121/2000 Coll., on Copyright and therefore Mendel University 
		in Brno has the right to conclude licence agreements on the utilization 
		of the thesis as a~school work in accordance with Article 60(1) of the 
		Copyright Act.\\par
		\\vskip\\intparskip Before concluding a~licence agreement on utilization of 
		the work by another person, I will request a written statement from the 
		university that the licence agreement is not in contradiction to 
		legitimate interests of the university, and I will also pay a~prospective 
		fee to cover the cost incurred in creating the work to the full amount of 
		such costs.
}

\\def\\c@podpis{podpis}
\\def\\s@podpis{podpis}
\\def\\a@podpis{signature}

\\def\\c@Obr{Obr.}
\\def\\s@Obr{Obr.}
\\def\\a@Obr{Fig.}

\\def\\c@Tab{Tab.}
\\def\\s@Tab{Tab.}
\\def\\a@Tab{Tab.}

\\def\\c@Obrazek{Obrázek}
\\def\\s@Obrazek{Obrázok}
\\def\\a@Obrazek{Figure}

\\def\\c@Tabulka{Tabulka}
\\def\\s@Tabulka{Tabuľka}
\\def\\a@Tabulka{Table}

\\def\\c@Klslova{Klíčová slova}
\\def\\s@Klslova{Kľúčové slová}
\\def\\a@Klslova{Key words}

\\def\\c@Literatura{Literatura}
\\def\\s@Literatura{Literatúra}
\\def\\a@Literatura{References}

\\def\\c@Zdroj{Zdroj}
\\def\\s@Zdroj{Zdroj}
\\def\\a@Zdroj{Source}

\\def\\c@{}
\\def\\s@{}
\\def\\a@{}


\\definecolor{codegreen}{rgb}{0,0.6,0}
\\definecolor{codegray}{rgb}{0.5,0.5,0.5}
\\definecolor{codepurple}{rgb}{0.58,0,0.82}

\\definecolor{backcolour}{rgb}{0.95,0.95,0.92}
\\definecolor{deepblue}{rgb}{0,0,0.5}
\\definecolor{deepred}{rgb}{0.6,0,0}
\\definecolor{deepgreen}{rgb}{0,0.5,0}


\\lstdefinestyle{mystyle}{
	commentstyle=\\color{codegreen},
	keywordstyle=\\color{deepblue},
	numberstyle=\\tiny\\color{codegray},
	stringstyle=\\color{deepred},
	basicstyle=\\ttfamily\\footnotesize,
	breakatwhitespace=false,         
	breaklines=true,                 
	captionpos=b,                    
	keepspaces=true,                 
	numbers=left,                    
	numbersep=5pt,                  
	showspaces=false,                
	showstringspaces=false,
	showtabs=false,                  
	tabsize=2
}

\\lstset{style=mystyle}

%%%%%%%%%%%%%%%%%%%%%% konec stylu dipp %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
`;
