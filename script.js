// Wrap everything in a DOMContentLoaded listener to ensure HTML is ready
document.addEventListener('DOMContentLoaded', () => {

    // --- Element References ---
    const csvFileInput = document.getElementById('csvFileInput');
    const viewerFileNameSpan = document.getElementById('viewerFileName');
    const searchInput = document.getElementById('searchInput');
    const buildingFilter = document.getElementById('filterBuilding');
    const zoneFilter = document.getElementById('filterZone');
    const disciplineFilter = document.getElementById('filterDiscipline');
    const contractorFilter = document.getElementById('filterContractor');
    const responsibleFilter = document.getElementById('filterResponsible');
    const statusFilter = document.getElementById('filterStatus');
    const startDateFilter = document.getElementById('filterStartDateAfter');
    const finishDateFilter = document.getElementById('filterFinishDateBefore');
    const resetFiltersButton = document.getElementById('resetFilters');
    const tableBody = document.getElementById('scheduleTableBody');
    const tableHeaderRow = document.getElementById('viewerHeaderRow');
    const viewerTable = document.getElementById('viewerTable');
    const summaryTotalTasks = document.getElementById('totalTasks');
    const summaryCompletedTasks = document.getElementById('completedTasks');
    const summaryInProgressTasks = document.getElementById('inProgressTasks');
    const summaryNotStartedTasks = document.getElementById('notStartedTasks');
    const summaryOverdueTasks = document.getElementById('overdueTasks');
    const summaryNearDueTasks = document.getElementById('nearDueTasks');
    const summaryUpcomingTasks = document.getElementById('upcomingTasks');
    const groupingSelect = document.getElementById('groupingSelect');
    const toggleColumnSelectorBtn = document.getElementById('toggleColumnSelectorBtn');
    const columnSelectorDiv = document.getElementById('columnSelector');
    const columnTogglesDiv = document.getElementById('columnToggles');
    const applyColumnChangesBtn = document.getElementById('applyColumnChanges');
    const closeColumnSelectorBtn = document.getElementById('closeColumnSelector');
    // Comparison elements removed
    // NYT: Referencer til custom file input knapper
    const viewerTrigger = document.querySelector('label[for="csvFileInput"]'); // Find label by 'for' attribute
    // Comparison triggers removed

    // --- Viewer State ---
    let rawData = [];
    let filteredData = [];
    let currentSort = { column: '(*)Finish', direction: 'asc' };
    let currentGrouping = '';
    let columnVisibility = {};
    let ALL_COLUMNS = [];

    // --- Comparison State Removed ---

    // --- Constants ---
    const NEAR_DUE_THRESHOLD_DAYS = 7;
    const UPCOMING_START_THRESHOLD_DAYS = 7;
    let ACTIVITY_ID_KEY = 'Activity ID'; // Default, might be updated

    // --- Mapping & Helper Functions ---
    // ... (alle dine eksisterende helper funktioner: disciplineMapping, getDisciplineFromPackage, getBuildingFromZone, monthMap, parseFlexibleDate, formatDateForDisplay, checkOverdue, checkNearDue, checkUpcomingStart, robustCSVSplit, parseCSV, calculateDateDifference, sanitizeForCSSClass, escapeHtml, parseFloatLocal - forbliver uændrede) ...
    const disciplineMapping = { 'PPV.-WP-208a': 'Byg/CR Væg', 'PPV.-WP-206b': 'Byg/Tømrer', 'PPV.-WP-220': 'Sprinkler', 'PPV.-WP-222a': 'HVAC', 'PPV.-WP-217': 'BMS', 'PPV.-WP-209b': 'Møbler/Indflyt', 'PPV.-WP-224': 'EL', 'PPV.-WP-207b': 'Gulv', 'PPV.-WP-222b': 'VVS/Utility', 'PPV.-WP-203c': 'Facade', 'PPV.-WP-204d': 'Beton/Stairs', 'PPV.-WP-223C': 'EL-Sikkerhed', 'PPV.-WP-323d': 'SGS/EL', 'PPV.-WP-N/A': 'Plan/Diverse', 'PPV.-WP-317q': 'Rør/Proces', 'PPV.-WP-323': 'EL/I&C Proces', 'PPV.-WP-304a': 'Proces Udstyr', 'PPV.-WP-604-610': 'Logistik/AGV', 'PPV.-WP-323b': 'IT/Netværk', 'PPV.-WP-317g': 'Rør/Proces', 'PPV.-WP-301a': 'Proces Mont.', 'PPV.-WP-301b': 'Proces Lever.', 'PPV.-WP-233': 'Køl', 'PPV.-WP-205b': 'Stålkonstruktion', 'PPV.-WP-328a': 'Stålkonstruktion', 'PPV.-WP-221': 'Ventilation', 'PPV.-WP-223': 'EL (K&L?)', 'PPV.-WP-Pen': 'Plan/Diverse', 'PPV.-WP-311': 'Proces Udstyr', 'PPV.-WP-313a': 'Proces Speciel', 'PPV.-WP-313b': 'Proces Speciel', 'PPV.-WP-307c': 'Proces Stål/Kanal', 'PPV.-WP-324': 'Isolering', 'PPV.-WP-208b': 'Møbler/CR', 'PPV.-WP-334': 'Proces Mekanisk', 'PPV.-WP-601': 'Automation/Robot', 'PPV.-WP-317f': 'Rør/Proces', 'PPV.-WP-305b': 'Proces Udstyr', 'PPV.-WP-306a': 'Proces Udstyr', 'PPV.-WP-330a': 'Speciel Udstyr', 'PPV.-WP-330Y': 'Vægte', 'PPV.-WP-330d': 'Speciel Udstyr', 'PPV.-WP-312': 'Vask/Udstyr', 'PPV.-WP-218': 'FMS/Automation', 'PPV.-WP-330YY': 'Løfteudstyr', 'PPV.-WP-330I': 'Kran/Løft', 'PPV.-WP-330V': 'Løfteudstyr', 'PPV.-WP-330K': 'Løfteudstyr', 'PPV.-WP-330TT': 'Løfteudstyr', 'PPV.-WP-330VV': 'Løfteudstyr', 'PPV.-WP-207a': 'Gulv', 'PPV.-WP-206a': 'Byg/Tømrer', 'PPV.-WP-203e.1': 'Byg/Diverse', 'PPV.-WP-205': 'Stål/Sikring', 'PPV.-WP-207c': 'Gulv', 'PPV.-WP-234': 'Køl/Udstyr', };
    function getDisciplineFromPackage(packageCode) { return disciplineMapping[packageCode] || 'Ukendt'; }
    function getBuildingFromZone(zoneCode) { if (!zoneCode) return 'Ukendt'; const match = String(zoneCode).match(/^(\d{2})[^\d]/); if (match && match[1]) return `B${match[1]}`; if (String(zoneCode).match(/^(FS|BS)\d*\./i)) return 'FS/BS'; if (String(zoneCode).match(/^TR\d+/i)) return 'TR'; if (String(zoneCode).toLowerCase() === 'outside') return 'Outside'; if (String(zoneCode).toLowerCase() === 'general') return 'General'; return 'Andet'; }
    const monthMap = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
    function parseFlexibleDate(dateString) { if (!dateString || typeof dateString !== 'string') return null; dateString = dateString.trim(); if (!dateString) return null; try { let parts = dateString.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/); if (parts) { const day = parseInt(parts[1], 10); const month = parseInt(parts[2], 10) - 1; const year = parseInt(parts[3], 10); const date = new Date(Date.UTC(year, month, day)); if (!isNaN(date) && date.getUTCFullYear() === year && date.getUTCMonth() === month && date.getUTCDate() === day) return date; } parts = dateString.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{2})$/); if (parts) { const day = parseInt(parts[1], 10); const monthAbbr = parts[2].toLowerCase(); const shortYear = parseInt(parts[3], 10); const month = monthMap[monthAbbr]; if (month !== undefined && !isNaN(day) && !isNaN(shortYear)) { const year = shortYear >= 50 ? 1900 + shortYear : 2000 + shortYear; const date = new Date(Date.UTC(year, month, day)); if (!isNaN(date) && date.getUTCFullYear() === year && date.getUTCMonth() === month && date.getUTCDate() === day) return date; } } parts = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/); if (parts) { const year = parseInt(parts[1], 10); const month = parseInt(parts[2], 10) - 1; const day = parseInt(parts[3], 10); const date = new Date(Date.UTC(year, month, day)); if (!isNaN(date) && date.getUTCFullYear() === year && date.getUTCMonth() === month && date.getUTCDate() === day) return date; } const standardDate = new Date(dateString); if (!isNaN(standardDate)) { return new Date(Date.UTC(standardDate.getFullYear(), standardDate.getMonth(), standardDate.getDate())); } } catch (e) { console.error(`Error parsing date "${dateString}":`, e); return null; } return null; }
    function formatDateForDisplay(dateString) { const date = parseFlexibleDate(dateString); if (!date) return ''; const day = String(date.getUTCDate()).padStart(2, '0'); const month = String(date.getUTCMonth() + 1).padStart(2, '0'); const year = date.getUTCFullYear(); return `${day}/${month}/${year}`; }
    function checkOverdue(finishDate, percentage) { if (percentage >= 100 || !finishDate) return false; const today = new Date(); today.setUTCHours(0, 0, 0, 0); return finishDate < today; }
    function checkNearDue(finishDate, percentage, thresholdDays = NEAR_DUE_THRESHOLD_DAYS) { if (percentage >= 100 || !finishDate) return false; const today = new Date(); today.setUTCHours(0, 0, 0, 0); const thresholdDate = new Date(today); thresholdDate.setUTCDate(today.getUTCDate() + thresholdDays); return finishDate >= today && finishDate <= thresholdDate; }
    function checkUpcomingStart(startDate, percentage, thresholdDays = UPCOMING_START_THRESHOLD_DAYS) { if (percentage > 0 || !startDate) return false; const today = new Date(); today.setUTCHours(0, 0, 0, 0); const thresholdDate = new Date(today); thresholdDate.setUTCDate(today.getUTCDate() + thresholdDays); return startDate >= today && startDate <= thresholdDate; }
    function robustCSVSplit(line) { const fields = []; let currentField = ''; let inQuotes = false; for (let i = 0; i < line.length; i++) { const char = line[i]; const nextChar = line[i+1]; if (char === '"' && nextChar === '"') { currentField += '"'; i++; } else if (char === '"') { inQuotes = !inQuotes; } else if (char === ',' && !inQuotes) { fields.push(currentField); currentField = ''; } else { currentField += char; } } fields.push(currentField); return fields; }
    function parseCSV(csvText) { const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== ''); if (lines.length < 1) return { headers: [], data: [] }; if (lines[0].charCodeAt(0) === 0xFEFF) { lines[0] = lines[0].substring(1); } const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '')); const data = []; if (lines.length < 2) { return { headers: headers, data: [] }; } for (let i = 1; i < lines.length; i++) { if (!lines[i].trim()) continue; const values = robustCSVSplit(lines[i]); if (values.length < headers.length) { console.warn(`Skipping line ${i + 1}: Fewer columns than headers (${values.length} vs ${headers.length}). Line: ${lines[i]}`); continue; } const rowObject = {}; headers.forEach((header, index) => { let value = (values[index] !== undefined) ? values[index].trim() : ''; if (value.startsWith('"') && value.endsWith('"')) { value = value.substring(1, value.length - 1).replace(/""/g, '"'); } rowObject[header] = value; }); data.push(rowObject); } return { headers, data }; }
    function calculateDateDifference(date1, date2) { if (!date1 || !date2) return null; const timeDiff = date2.getTime() - date1.getTime(); return Math.round(timeDiff / (1000 * 3600 * 24)); }
    function sanitizeForCSSClass(str) { if (!str) return 'group-empty'; return 'group-' + String(str).replace(/[^a-zA-Z0-9_-]/g, '-').replace(/-+/g, '-').toLowerCase(); }
    function escapeHtml(unsafe) { if (typeof unsafe !== 'string') return unsafe; return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;"); } // Use HTML entities
    function parseFloatLocal(value) { if (typeof value !== 'string') { value = String(value || '0'); } return parseFloat(value.replace(',', '.') || '0'); }

    // --- NYT: Custom File Input Handler ---
    function setupCustomFileInput(triggerButton, fileInput, fileNameSpan, onChangeHandler = null) { // Add optional handler
        if (!triggerButton || !fileInput || !fileNameSpan) {
            // console.warn("Elementer mangler for custom file input setup:", {triggerButton, fileInput, fileNameSpan});
            return; // Stop hvis et element mangler
        }

        // Klik på trigger-knappen åbner det skjulte file input
        triggerButton.addEventListener('click', () => {
            fileInput.click();
        });

        // Når en fil vælges i det skjulte input
        fileInput.addEventListener('change', (event) => {
            if (event.target.files && event.target.files.length > 0) {
                const fileName = event.target.files[0].name;
                fileNameSpan.textContent = fileName; // Opdater synlig tekst
                fileNameSpan.title = fileName;       // Opdater tooltip (til fuldt navn)
            } else {
                // Hvis brugeren annullerer
                fileNameSpan.textContent = 'Ingen fil valgt';
                fileNameSpan.title = 'Ingen fil valgt';
                // Nulstil evt. input value for at tillade valg af samme fil igen
                fileInput.value = '';
            }
            // Comparison button check removed

            // Call the specific handler if provided
            if (onChangeHandler) {
                onChangeHandler(event);
            }
        });
    }

    // --- Viewer Functions ---
    function processData(data) {
        // Nulstil data arrays og kolonner
        rawData = [];
        filteredData = [];
        ALL_COLUMNS.length = 0;
        columnVisibility = {};
        columnTogglesDiv.innerHTML = '';

        // Hvis data kommer fra parseCSV
        if (data.headers && Array.isArray(data.data)) {
            rawData = data.data;
            const headersFromFile = data.headers;
            console.log("Læste headers fra fil:", headersFromFile);

            // Find Activity ID Key
            const potentialIdKeys = ['Activity ID', 'Activity Id', 'ID', 'Task ID', 'Aktivitets ID'];
            let foundActivityIdKey = null;
            for (const key of potentialIdKeys) {
                if (headersFromFile.includes(key)) {
                    foundActivityIdKey = key;
                    break;
                }
            }
            if (!foundActivityIdKey && rawData.length > 0) {
                throw new Error(`Kunne ikke finde en passende nøglekolonne i filens headers: ${headersFromFile.join(', ')}`);
            }
            ACTIVITY_ID_KEY = foundActivityIdKey;
            console.log(`Bruger '${ACTIVITY_ID_KEY}' som nøglekolonne.`);

            // Opdater kolonner
            if (rawData.length > 0 || headersFromFile.length > 0) {
                const headersInHtml = tableHeaderRow ? Array.from(tableHeaderRow.querySelectorAll('th')).map(th => th.dataset.column).filter(Boolean) : [];
                ALL_COLUMNS = [...headersInHtml];
                headersFromFile.forEach(header => {
                    if (!ALL_COLUMNS.includes(header)) ALL_COLUMNS.push(header);
                });
            }
        } 
        // Hvis data kommer fra XLSX
        else if (Array.isArray(data)) {
            rawData = data;
            if (rawData.length > 0) {
                const headersFromFile = Object.keys(rawData[0]);
                console.log("Læste headers fra XLSX:", headersFromFile);

                // Find Activity ID Key
                const potentialIdKeys = ['Activity ID', 'Activity Id', 'ID', 'Task ID', 'Aktivitets ID'];
                let foundActivityIdKey = null;
                for (const key of potentialIdKeys) {
                    if (headersFromFile.includes(key)) {
                        foundActivityIdKey = key;
                        break;
                    }
                }
                if (!foundActivityIdKey) {
                    throw new Error(`Kunne ikke finde en passende nøglekolonne i XLSX headers: ${headersFromFile.join(', ')}`);
                }
                ACTIVITY_ID_KEY = foundActivityIdKey;
                console.log(`Bruger '${ACTIVITY_ID_KEY}' som nøglekolonne.`);

                // Opdater kolonner
                const headersInHtml = tableHeaderRow ? Array.from(tableHeaderRow.querySelectorAll('th')).map(th => th.dataset.column).filter(Boolean) : [];
                ALL_COLUMNS = [...headersInHtml];
                headersFromFile.forEach(header => {
                    if (!ALL_COLUMNS.includes(header)) ALL_COLUMNS.push(header);
                });
            }
        }

        // Behandl data
        if (rawData.length > 0) {
            // Find nøgler for zoner og andre felter
            const zoneKey = ALL_COLUMNS.find(h => h.toUpperCase() === 'PPV_L3_03 ZONE') || 'PPV_L3_03 ZONE';
            const packageKey = ALL_COLUMNS.find(h => h.toUpperCase() === 'NNE_GLOBAL_PROC._PACKAGE') || 'NNE_Global_Proc._Package';
            const contractorKey = ALL_COLUMNS.find(h => h.toUpperCase() === 'PPV_L3_05 CONTRACTOR') || 'PPV_L3_05 Contractor';
            const responsibleKey = ALL_COLUMNS.find(h => h.toUpperCase() === 'PPV_L3_04 TASK RESPONSIBLE') || 'PPV_L3_04 Task Responsible';

            // Tilføj bygning og disciplin til hver række
            rawData.forEach(row => {
                row['Building'] = getBuildingFromZone(row[zoneKey]);
                row['Discipline'] = getDisciplineFromPackage(row[packageKey]);
                if (!row.hasOwnProperty(contractorKey)) row[contractorKey] = '';
                if (!row.hasOwnProperty(responsibleKey)) row[responsibleKey] = '';
            });

            // Tilføj ekstra kolonner hvis de ikke findes
            if (!ALL_COLUMNS.includes('Building')) ALL_COLUMNS.push('Building');
            if (!ALL_COLUMNS.includes('Discipline')) ALL_COLUMNS.push('Discipline');

            // Initialiser kolonnevisning og opdater UI
            initializeColumnVisibility();
            populateColumnSelector();
            populateFiltersViewer(zoneKey, contractorKey, responsibleKey);
            applyFiltersAndSearch();
            applyColumnVisibility();
        } else {
            tableBody.innerHTML = `<tr><td colspan="15">Ingen data fundet i filen.</td></tr>`;
            resetSummaryBox();
        }
    }

    function handleFileSelectViewer(event) {
        const file = event.target.files[0];
        if (!file) return;

        document.getElementById('viewerFileName').textContent = file.name;
        document.getElementById('viewerFileName').title = file.name;

        // Reset table and summary box
        tableBody.innerHTML = `<tr><td colspan="15">Indlæser fil...</td></tr>`;
        resetSummaryBox();

        const reader = new FileReader();
        
        reader.onerror = function(err) {
            console.error("Fejl ved læsning af fil:", err);
            alert("Der opstod en fejl under læsning af filen.");
            tableBody.innerHTML = `<tr><td colspan="15">Fejl under læsning af fil.</td></tr>`;
            resetSummaryBox();
        };

        try {
            if (file.name.toLowerCase().endsWith('.csv')) {
                // Håndter CSV fil
                reader.onload = function(e) {
                    try {
                        const text = e.target.result;
                        const data = parseCSV(text);
                        processData(data);
                    } catch (error) {
                        console.error("Fejl ved behandling af CSV:", error);
                        alert(`Der opstod en fejl: ${error.message}`);
                        tableBody.innerHTML = `<tr><td colspan="15">Fejl ved behandling af CSV data.</td></tr>`;
                        resetSummaryBox();
                    }
                };
                reader.readAsText(file);
            } else if (file.name.toLowerCase().endsWith('.xlsx')) {
                // Håndter XLSX fil
                reader.onload = function(e) {
                    try {
                        const data = new Uint8Array(e.target.result);
                        const workbook = XLSX.read(data, {type: 'array'});
                        const firstSheetName = workbook.SheetNames[0];
                        const worksheet = workbook.Sheets[firstSheetName];
                        
                        // Konverter XLSX data med specifikke formateringsindstillinger
                        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                            raw: false,  // Returnér formaterede værdier
                            dateNF: 'dd/mm/yyyy',  // Dato format
                            defval: ''  // Standard værdi for tomme celler
                        });

                        // Konverter Excel serielle datoer til korrekt format
                        jsonData.forEach(row => {
                            // Håndter start dato
                            if (row['(*)Start']) {
                                const startDate = parseFlexibleDate(row['(*)Start']);
                                if (startDate) {
                                    row['(*)Start'] = formatDateForDisplay(startDate.toISOString());
                                }
                            }
                            
                            // Håndter slut dato
                            if (row['(*)Finish']) {
                                const finishDate = parseFlexibleDate(row['(*)Finish']);
                                if (finishDate) {
                                    row['(*)Finish'] = formatDateForDisplay(finishDate.toISOString());
                                }
                            }

                            // Håndter procent færdig
                            if (row['Activity % Complete(%)'] !== undefined) {
                                // Konverter til tal og formater som heltal
                                const percent = parseFloatLocal(row['Activity % Complete(%)']);
                                row['Activity % Complete(%)'] = percent.toString();
                            }
                        });

                        processData(jsonData);
                    } catch (error) {
                        console.error("Fejl ved behandling af XLSX:", error);
                        alert(`Der opstod en fejl: ${error.message}`);
                        tableBody.innerHTML = `<tr><td colspan="15">Fejl ved behandling af XLSX data.</td></tr>`;
                        resetSummaryBox();
                    }
                };
                reader.readAsArrayBuffer(file);
            }
        } catch (error) {
            console.error("Fejl ved håndtering af fil:", error);
            alert(`Der opstod en fejl: ${error.message}`);
            tableBody.innerHTML = `<tr><td colspan="15">Fejl ved håndtering af fil.</td></tr>`;
            resetSummaryBox();
        }
    }

    function clearDropdownOptions(selectElement) { /* ... (uændret) ... */ if(selectElement) selectElement.innerHTML = '<option value="">Alle</option>'; }
    function populateFiltersViewer(zoneKey, contractorKey, responsibleKey) { /* ... (uændret) ... */
         console.log(`populateFiltersViewer kaldt med keys: Zone='${zoneKey}', Contr='${contractorKey}', Resp='${responsibleKey}'`); const buildings = new Set(); const zones = new Set(); const disciplines = new Set(); const contractors = new Set(); const responsibles = new Set(); if (!rawData || rawData.length === 0) { console.warn("rawData er tom i populateFiltersViewer."); return; }
         rawData.forEach((row, index) => { const building = row['Building']; const discipline = row['Discipline']; const zoneValue = row[zoneKey]; const contractorValue = row[contractorKey]; const responsibleValue = row[responsibleKey]; if (building && building !== 'Ukendt') buildings.add(building); if (zoneValue) zones.add(zoneValue); if (discipline && discipline !== 'Ukendt') disciplines.add(discipline); if (contractorValue) contractors.add(contractorValue); if (responsibleValue) responsibles.add(responsibleValue); });
         console.log("Fundne værdier til filtre:", { buildings: [...buildings], zones: [...zones], disciplines: [...disciplines], contractors: [...contractors], responsibles: [...responsibles] });
         const populateSelect = (selectElement, items) => { if (!selectElement) { console.error("populateSelect kaldt med ugyldigt selectElement"); return; } const currentValue = selectElement.value; clearDropdownOptions(selectElement); [...items].sort((a, b) => { const aStr = String(a || ''); const bStr = String(b || ''); const isABuilding = aStr.match(/^B(\d+)$/); const isBBuilding = bStr.match(/^B(\d+)$/); if (isABuilding && isBBuilding) return parseInt(isABuilding[1]) - parseInt(isBBuilding[1]); if (isABuilding) return -1; if (isBBuilding) return 1; return aStr.localeCompare(bStr, undefined, {numeric: true, sensitivity: 'base'}); }).forEach(item => { if (item) { const option = document.createElement('option'); option.value = item; option.textContent = item; selectElement.appendChild(option); } }); if (Array.from(selectElement.options).some(opt => opt.value === currentValue)) { selectElement.value = currentValue; } console.log(`Fyldt ${selectElement.id} med ${selectElement.options.length -1} værdier.`); };
         populateSelect(buildingFilter, buildings); populateSelect(zoneFilter, zones); populateSelect(disciplineFilter, disciplines); populateSelect(contractorFilter, contractors); populateSelect(responsibleFilter, responsibles);
    }
    function applyFiltersAndSearch() { /* ... (uændret) ... */
        const searchTerm = searchInput.value.toLowerCase(); const selectedBuilding = buildingFilter.value; const selectedZone = zoneFilter.value; const selectedDiscipline = disciplineFilter.value; const selectedContractor = contractorFilter.value; const selectedResponsible = responsibleFilter.value; const selectedStatus = statusFilter.value; const startDateStr = startDateFilter.value; const finishDateStr = finishDateFilter.value; const filterStartDate = startDateStr ? parseFlexibleDate(startDateStr) : null; const filterFinishDate = finishDateStr ? parseFlexibleDate(finishDateStr) : null; const filterFinishDateEndOfDay = filterFinishDate ? new Date(Date.UTC(filterFinishDate.getUTCFullYear(), filterFinishDate.getUTCMonth(), filterFinishDate.getUTCDate(), 23, 59, 59, 999)) : null;
        filteredData = rawData.filter(row => { const zoneKey = Object.keys(row).find(k => k.toUpperCase() === 'PPV_L3_03 ZONE') || 'PPV_L3_03 ZONE'; const contractorKey = Object.keys(row).find(k => k.toUpperCase() === 'PPV_L3_05 CONTRACTOR') || 'PPV_L3_05 Contractor'; const responsibleKey = Object.keys(row).find(k => k.toUpperCase() === 'PPV_L3_04 TASK RESPONSIBLE') || 'PPV_L3_04 Task Responsible'; if (selectedBuilding && row['Building'] !== selectedBuilding) return false; if (selectedZone && row[zoneKey] !== selectedZone) return false; if (selectedDiscipline && row['Discipline'] !== selectedDiscipline) return false; if (selectedContractor && row[contractorKey] !== selectedContractor) return false; if (selectedResponsible && row[responsibleKey] !== selectedResponsible) return false; const rowStartDate = parseFlexibleDate(row['(*)Start']); const rowFinishDate = parseFlexibleDate(row['(*)Finish']); if (filterStartDate && (!rowStartDate || rowStartDate < filterStartDate)) return false; if (filterFinishDateEndOfDay && (!rowFinishDate || rowFinishDate > filterFinishDateEndOfDay)) return false; const percentage = parseFloatLocal(row['Activity % Complete(%)']); const isRowOverdue = checkOverdue(rowFinishDate, percentage); const isRowNearDue = checkNearDue(rowFinishDate, percentage); const isRowUpcomingStart = checkUpcomingStart(rowStartDate, percentage); if (selectedStatus) { switch(selectedStatus) { case 'not_started': if (percentage !== 0) return false; break; case 'in_progress': if (percentage <= 0 || percentage >= 100) return false; break; case 'completed': if (percentage < 100) return false; break; case 'overdue': if (!isRowOverdue) return false; break; case 'near_due': if (!isRowNearDue || isRowOverdue || percentage >= 100) return false; break; case 'upcoming_start': if (!isRowUpcomingStart) return false; break; } } if (searchTerm) { let found = false; for (const col of ALL_COLUMNS) { if (row.hasOwnProperty(col)) { const cellValue = String(row[col] || '').toLowerCase(); if (cellValue.includes(searchTerm)) { found = true; break; } } } if (!found) return false; } return true; });
        sortDataViewer(); updateSummaryBox(filteredData); displayDataViewer(filteredData);
    }
    function resetAllFiltersViewer() { /* ... (uændret) ... */ searchInput.value = ''; buildingFilter.value = ''; zoneFilter.value = ''; disciplineFilter.value = ''; contractorFilter.value = ''; responsibleFilter.value = ''; statusFilter.value = ''; startDateFilter.value = ''; finishDateFilter.value = ''; groupingSelect.value = ''; currentGrouping = ''; }
    function resetSummaryBox() { /* ... (uændret) ... */ summaryTotalTasks.textContent = '0'; summaryCompletedTasks.textContent = '0'; summaryInProgressTasks.textContent = '0'; summaryNotStartedTasks.textContent = '0'; summaryOverdueTasks.textContent = '0'; summaryNearDueTasks.textContent = '0'; summaryUpcomingTasks.textContent = '0'; }
    function resetAllViewer() { /* ... (uændret) ... */
        if(csvFileInput) csvFileInput.value = ''; if(viewerFileNameSpan) viewerFileNameSpan.textContent = 'Ingen fil valgt'; if(viewerFileNameSpan) viewerFileNameSpan.title = 'Ingen fil valgt'; resetAllFiltersViewer(); rawData = []; filteredData = []; ALL_COLUMNS.length = 0; columnVisibility = {}; if(columnTogglesDiv) columnTogglesDiv.innerHTML = ''; const initialColspan = tableHeaderRow ? tableHeaderRow.querySelectorAll('th').length || 1 : 1; if(tableBody) tableBody.innerHTML = `<tr><td colspan="${initialColspan}">Vælg venligst en CSV-fil.</td></tr>`; resetSummaryBox(); currentSort = { column: '(*)Finish', direction: 'asc' }; if (tableHeaderRow) updateSortIconsViewer(); if (columnSelectorDiv) columnSelectorDiv.style.display = 'none'; initializeColumnVisibility(); applyColumnVisibility();
    }
    function handleSortViewer(column) { /* ... (uændret) ... */ if (currentSort.column === column) { currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc'; } else { currentSort.column = column; currentSort.direction = 'asc'; } applyFiltersAndSearch(); }
    function sortDataViewer() { /* ... (uændret) ... */
         const { column, direction } = currentSort; if (!column || !filteredData) return; const isAsc = direction === 'asc';
         filteredData.sort((a, b) => { let valA = a[column]; let valB = b[column]; if (column === '(*)Start' || column === '(*)Finish') { valA = parseFlexibleDate(valA); valB = parseFlexibleDate(valB); if (valA === null && valB === null) return 0; if (valA === null) return 1; if (valB === null) return -1; return isAsc ? valA - valB : valB - valA; } else if (['Original Duration(d)', 'Remaining Duration(d)', 'Activity % Complete(%)'].includes(column)) { valA = parseFloatLocal(valA); valB = parseFloatLocal(valB); if (isNaN(valA)) valA = isAsc ? Infinity : -Infinity; if (isNaN(valB)) valB = isAsc ? Infinity : -Infinity; return isAsc ? valA - valB : valB - valA; } else if (column === 'Building') { const aStr = String(valA || ''); const bStr = String(valB || ''); const isABuilding = aStr.match(/^B(\d+)$/); const isBBuilding = bStr.match(/^B(\d+)$/); if (isABuilding && isBBuilding) { const numA = parseInt(isABuilding[1]); const numB = parseInt(isBBuilding[1]); return isAsc ? numA - numB : numB - numA; } if (isABuilding && !isBBuilding) return -1; if (!isABuilding && isBBuilding) return 1; return isAsc ? aStr.localeCompare(bStr, undefined, {numeric: true, sensitivity: 'base'}) : bStr.localeCompare(aStr, undefined, {numeric: true, sensitivity: 'base'}); } else { valA = String(valA || ''); valB = String(valB || ''); return isAsc ? valA.localeCompare(valB, undefined, {numeric: true, sensitivity: 'base'}) : valB.localeCompare(valA, undefined, {numeric: true, sensitivity: 'base'}); } });
         updateSortIconsViewer();
    }
    function updateSortIconsViewer() { /* ... (uændret) ... */ if (!tableHeaderRow) return; tableHeaderRow.querySelectorAll('th .sort-icon').forEach(icon => icon.textContent = ''); const currentTh = tableHeaderRow.querySelector(`th[data-column="${currentSort.column}"]`); if (currentTh) { const iconSpan = currentTh.querySelector('.sort-icon'); if (iconSpan) iconSpan.textContent = currentSort.direction === 'asc' ? ' ▲' : ' ▼'; } }
    function displayDataViewer(data) {
        if (!tableBody) return;
        tableBody.innerHTML = '';
        
        if (data.length === 0) {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td colspan="${getVisibleColumnCount()}">Ingen resultater fundet.</td>`;
            tableBody.appendChild(tr);
            return;
        }
        
        if (currentGrouping) {
            // Group the data
            const groups = {};
            data.forEach(row => {
                const groupValue = row[currentGrouping] || '';
                if (!groups[groupValue]) {
                    groups[groupValue] = [];
                }
                groups[groupValue].push(row);
            });
            
            // Sort group keys
            const sortedGroups = Object.keys(groups).sort((a, b) => {
                if (currentGrouping === 'Building') {
                    const aMatch = a.match(/^B(\d+)$/);
                    const bMatch = b.match(/^B(\d+)$/);
                    if (aMatch && bMatch) {
                        return parseInt(aMatch[1]) - parseInt(bMatch[1]);
                    }
                }
                return a.localeCompare(b);
            });
            
            // Create rows for each group
            sortedGroups.forEach(groupValue => {
                const groupClass = sanitizeForCSSClass(groupValue);
                
                // Add group header
                const headerRow = document.createElement('tr');
                headerRow.className = 'group-header';
                headerRow.dataset.groupClass = groupClass;
                const headerCell = document.createElement('td');
                headerCell.colSpan = getVisibleColumnCount();
                headerCell.textContent = groupValue || '(Ingen værdi)';
                headerRow.appendChild(headerCell);
                tableBody.appendChild(headerRow);
                
                // Add data rows for this group
                groups[groupValue].forEach(rowData => {
                    const tr = createTableRow(rowData, groupClass);
                    tableBody.appendChild(tr);
                });
            });
        } else {
            // No grouping, just add all rows
            data.forEach(rowData => {
                const tr = createTableRow(rowData);
                tableBody.appendChild(tr);
            });
        }
    }
    function createTableRow(rowData, groupClass = '') {
        const tr = document.createElement('tr');
        tr.className = 'data-row' + (groupClass ? ` ${groupClass}` : '');
        
        // Add status classes
        const percentage = parseFloatLocal(rowData['Activity % Complete(%)']);
        const finishDate = parseFlexibleDate(rowData['(*)Finish']);
        const startDate = parseFlexibleDate(rowData['(*)Start']);
        
        if (checkOverdue(finishDate, percentage)) {
            tr.classList.add('overdue');
        } else if (checkNearDue(finishDate, percentage)) {
            tr.classList.add('near-due');
        }
        if (percentage >= 100) {
            tr.classList.add('completed');
        }
        
        // Create cells for each visible column
        tableHeaderRow.querySelectorAll('th').forEach(th => {
            const columnKey = th.dataset.column;
            if (!columnKey) return;
            
            const td = document.createElement('td');
            td.dataset.column = columnKey;
            
            if (columnVisibility[columnKey] === false) {
                td.classList.add('hidden-col');
            }
            
            // Special handling for percentage column
            if (columnKey === 'Activity % Complete(%)') {
                const percentageText = document.createElement('span');
                percentageText.className = 'percentage-text';
                percentageText.textContent = `${percentage}%`;
                td.appendChild(percentageText);
                
                const progressBar = createProgressBar(percentage);
                td.appendChild(progressBar);
            } else {
                // Regular cell content
                td.textContent = rowData[columnKey] || '';
            }
            
            tr.appendChild(td);
        });
        
        return tr;
    }
    function createProgressBar(percentage) {
        const container = document.createElement('div');
        container.className = 'progress-bar-container';
        
        const bar = document.createElement('div');
        bar.className = 'progress-bar';
        
        // Set the width of the progress bar
        bar.style.width = `${percentage}%`;
        
        // Add appropriate class based on percentage
        if (percentage >= 100) {
            bar.classList.add('complete');
        } else if (percentage >= 75) {
            bar.classList.add('high');
        } else if (percentage >= 25) {
            bar.classList.add('medium');
        } else {
            bar.classList.add('low');
        }
        
        container.appendChild(bar);
        return container;
    }
    function initializeColumnVisibility() { /* ... (uændret) ... */ columnVisibility = {}; ALL_COLUMNS.forEach(columnKey => { const th = tableHeaderRow ? tableHeaderRow.querySelector(`th[data-column="${columnKey}"]`) : null; columnVisibility[columnKey] = th ? !th.classList.contains('hidden-col') : true; }); }
    function populateColumnSelector() { /* ... (uændret) ... */
        if (!columnTogglesDiv) return; columnTogglesDiv.innerHTML = ''; const htmlOrder = tableHeaderRow ? Array.from(tableHeaderRow.querySelectorAll('th')).map(th => th.dataset.column).filter(Boolean) : []; const sortedColumns = [...ALL_COLUMNS].sort((a, b) => { const indexA = htmlOrder.indexOf(a); const indexB = htmlOrder.indexOf(b); if (indexA !== -1 && indexB !== -1) return indexA - indexB; if (indexA !== -1) return -1; if (indexB !== -1) return 1; return String(a).localeCompare(String(b)); }); sortedColumns.forEach(columnKey => { const thElement = tableHeaderRow ? tableHeaderRow.querySelector(`th[data-column="${columnKey}"]`) : null; const labelText = thElement ? thElement.textContent.replace(/▲|▼/g, '').trim() : columnKey; const div = document.createElement('div'); const label = document.createElement('label'); const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.value = columnKey; checkbox.id = `toggle-col-${columnKey.replace(/[^a-zA-Z0-9]/g, '-')}`; checkbox.checked = columnVisibility[columnKey] === undefined ? true : columnVisibility[columnKey]; label.htmlFor = checkbox.id; label.appendChild(checkbox); label.appendChild(document.createTextNode(` ${labelText}`)); div.appendChild(label); columnTogglesDiv.appendChild(div); });
    }
    function updateColumnVisibilityState() { /* ... (uændret) ... */ if (columnTogglesDiv) { columnTogglesDiv.querySelectorAll('input[type="checkbox"]').forEach(checkbox => { columnVisibility[checkbox.value] = checkbox.checked; }); } }
    function applyColumnVisibility() { /* ... (uændret) ... */ if (!viewerTable || !tableHeaderRow) return; ALL_COLUMNS.forEach(columnKey => { const isVisible = columnVisibility[columnKey]; const elements = viewerTable.querySelectorAll(`thead th[data-column="${columnKey}"], tbody td[data-column="${columnKey}"]`); elements.forEach(el => { el.classList.toggle('hidden-col', !isVisible); }); }); }
    function getVisibleColumnCount() { /* ... (uændret) ... */ if (!tableHeaderRow) return 1; let count = 0; tableHeaderRow.querySelectorAll('th').forEach(th => { const columnKey = th.dataset.column; if (columnKey && columnVisibility[columnKey]) { count++; } }); return count || 1; }
    function updateSummaryBox(data) { /* ... (uændret) ... */ let completed = 0; let inProgress = 0; let notStarted = 0; let overdue = 0; let nearDue = 0; let upcoming = 0; data.forEach(row => { const percentage = parseFloatLocal(row['Activity % Complete(%)']); const finishDate = parseFlexibleDate(row['(*)Finish']); const startDate = parseFlexibleDate(row['(*)Start']); if (percentage >= 100) { completed++; } else if (percentage > 0) { inProgress++; } else { notStarted++; } if (checkOverdue(finishDate, percentage)) { overdue++; } else if (checkNearDue(finishDate, percentage)) { nearDue++; } if (checkUpcomingStart(startDate, percentage)) { upcoming++; } }); summaryTotalTasks.textContent = data.length; summaryCompletedTasks.textContent = completed; summaryInProgressTasks.textContent = inProgress; summaryNotStartedTasks.textContent = notStarted; summaryOverdueTasks.textContent = overdue; summaryNearDueTasks.textContent = nearDue; summaryUpcomingTasks.textContent = upcoming; }

    // --- Comparison Functions Removed ---

    // --- Event Listeners Setup ---
    // Viewer filtre og sortering
    if(searchInput) searchInput.addEventListener('input', applyFiltersAndSearch);
    if(buildingFilter) buildingFilter.addEventListener('change', applyFiltersAndSearch);
    if(zoneFilter) zoneFilter.addEventListener('change', applyFiltersAndSearch);
    if(disciplineFilter) disciplineFilter.addEventListener('change', applyFiltersAndSearch);
    if(contractorFilter) contractorFilter.addEventListener('change', applyFiltersAndSearch);
    if(responsibleFilter) responsibleFilter.addEventListener('change', applyFiltersAndSearch);
    if(statusFilter) statusFilter.addEventListener('change', applyFiltersAndSearch);
    if(startDateFilter) startDateFilter.addEventListener('change', applyFiltersAndSearch);
    if(finishDateFilter) finishDateFilter.addEventListener('change', applyFiltersAndSearch);
    if(resetFiltersButton) resetFiltersButton.addEventListener('click', resetAllViewer);
    if(tableHeaderRow) tableHeaderRow.addEventListener('click', (event) => { const th = event.target.closest('th'); if (th && !th.classList.contains('hidden-col')) { const column = th.getAttribute('data-column'); if (column) handleSortViewer(column); } });
    if(groupingSelect) groupingSelect.addEventListener('change', (e) => { currentGrouping = e.target.value; applyFiltersAndSearch(); });

    // Gruppering fold ud/ind
    if(tableBody) tableBody.addEventListener('click', (event) => {
        const headerRow = event.target.closest('.group-header');
        if (headerRow) {
            const groupClass = headerRow.dataset.groupClass;
            if (groupClass) {
                const isCollapsed = headerRow.classList.toggle('collapsed');
                // Find *kun* data-rækker (ikke andre group-headers) der tilhører denne gruppe
                tableBody.querySelectorAll(`tr.${groupClass}.data-row`).forEach(row => {
                    row.classList.toggle('hidden-row', isCollapsed);
                });
            }
        }
    });

    // Kolonne Vælger
    if(toggleColumnSelectorBtn && columnSelectorDiv) {
         toggleColumnSelectorBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Forhindr body click listener i at lukke den med det samme
            const isVisible = columnSelectorDiv.style.display === 'block';
            columnSelectorDiv.style.display = isVisible ? 'none' : 'block';
         });
    }
    if(closeColumnSelectorBtn && columnSelectorDiv) {
         closeColumnSelectorBtn.addEventListener('click', () => {
            columnSelectorDiv.style.display = 'none';
         });
    }
    if(applyColumnChangesBtn && columnSelectorDiv) {
         applyColumnChangesBtn.addEventListener('click', () => {
            updateColumnVisibilityState();
            applyColumnVisibility();
            columnSelectorDiv.style.display = 'none';
            displayDataViewer(filteredData); // Gen-render tabel med nye kolonner
         });
    }
    // Luk kolonnevælger ved klik udenfor
    document.addEventListener('click', (event) => {
        if (columnSelectorDiv && columnSelectorDiv.style.display === 'block' &&
            toggleColumnSelectorBtn && !columnSelectorDiv.contains(event.target) &&
            event.target !== toggleColumnSelectorBtn && !toggleColumnSelectorBtn.contains(event.target))
        {
             columnSelectorDiv.style.display = 'none';
        }
    });

    // Comparison Event Listeners Removed

    // --- NYT: Initialiser Custom File Inputs ---
    setupCustomFileInput(viewerTrigger, csvFileInput, viewerFileNameSpan, handleFileSelectViewer); // Pass handler for viewer
    // Comparison File Input Setup Removed

    // Fjern de gamle change listeners der kun opdaterede tekst (håndteres nu af setupCustomFileInput)
    // if(csvFileInput) csvFileInput.addEventListener('change', handleFileSelectViewer, false); // Beholder denne for at trigge load
    // if(csvFileOldInput) csvFileOldInput.addEventListener('change', (e) => { /* ... fjernes ... */ });
    // if(csvFileNewInput) csvFileNewInput.addEventListener('change', (e) => { /* ... fjernes ... */ });

    // --- Initial Load ---
    resetAllViewer();
    // checkCompareButtonState removed
    console.log("Tidsplan Viewer & Sammenligning (Touch Opt.) v2.3 initialiseret.");

    // Opdater file input accept attribute
    csvFileInput.accept = '.csv,.xlsx';

}); // End of DOMContentLoaded