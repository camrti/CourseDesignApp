class PDFGenerator {
  
  static generateCourseBlueprint(blueprintData) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${blueprintData.title}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.4;
            color: #333;
            background: white;
            margin: 0;
            padding: 20px;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #ddd;
        }
        
        .header h1 {
            font-size: 1.8rem;
            font-weight: bold;
            color: #333;
            margin-bottom: 10px;
        }
        
        .header .gdta-ref {
            font-size: 0.9rem;
            color: #666;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .info-card {
            text-align: center;
            padding: 15px;
            background: #f5f5f5;
            border-radius: 5px;
        }
        
        .info-card .label {
            font-size: 0.8rem;
            color: #666;
            text-transform: uppercase;
            margin-bottom: 5px;
        }
        
        .info-card .value {
            font-size: 1.2rem;
            font-weight: bold;
            color: #333;
        }
        
        .section-title {
            font-size: 1.2rem;
            font-weight: bold;
            color: #333;
            margin-bottom: 15px;
            padding-bottom: 5px;
            border-bottom: 1px solid #ddd;
        }
        
        .course-section {
            margin-bottom: 25px;
            border: 1px solid #ddd;
            border-radius: 5px;
        }
        
        .section-header {
            background: #f0f0f0;
            padding: 10px 15px;
            font-size: 1rem;
            font-weight: bold;
            display: flex;
            justify-content: space-between;
        }
        
        .section-badge {
            font-size: 0.8rem;
            color: #666;
            font-weight: normal;
        }
        
        .gdta-ref {
            color: #16a085;
            font-weight: normal;
            font-style: italic;
        }
        
        .content-table {
            width: 100%;
            border-collapse: collapse;
        }
        
        .content-table th {
            background: #f8f8f8;
            padding: 8px 10px;
            text-align: left;
            font-size: 0.8rem;
            font-weight: bold;
            border-bottom: 1px solid #ddd;
        }
        
        .content-table td {
            padding: 8px 10px;
            border-bottom: 1px solid #f0f0f0;
            font-size: 0.85rem;
        }
        
        .content-number {
            background: #666;
            color: white;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 0.7rem;
            font-weight: bold;
        }
        
        .badge {
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 0.7rem;
            font-weight: bold;
            text-transform: uppercase;
        }
        
        .badge-video { background: #f5f5f5; color: #333; }
        .badge-audio { background: #f5f5f5; color: #333; }
        .badge-pdf { background: #f5f5f5; color: #333; }
        .badge-infographic { background: #f5f5f5; color: #333; }
        .badge-quiz { background: #f5f5f5; color: #333; }
        .badge-case_study { background: #f5f5f5; color: #333; }
        .badge-scenario { background: #f5f5f5; color: #333; }
        .badge-task { background: #f5f5f5; color: #333; }
        .badge-tutorial { background: #f5f5f5; color: #333; }
        
        .badge-beginner { background: #e8f5e8; color: #2e7d32; }
        .badge-intermediate { background: #fff8e1; color: #f57c00; }
        .badge-advanced { background: #ffebee; color: #c62828; }
        .badge-principiante { background: #e8f5e8; color: #2e7d32; }
        .badge-intermedio { background: #fff8e1; color: #f57c00; }
        .badge-avanzato { background: #ffebee; color: #c62828; }
        
        .empty-section {
            padding: 20px;
            text-align: center;
            color: #999;
            font-style: italic;
            font-size: 0.85rem;
        }
        
        @media print {
            .course-section { break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${blueprintData.title}</h1>
            <div class="gdta-ref">GDTA Reference: ${blueprintData.gdtaTitle}</div>
        </div>

        <div class="info-grid">
            <div class="info-card">
                <div class="label">Total Duration</div>
                <div class="value">${blueprintData.totalDuration}</div>
            </div>
            <div class="info-card">
                <div class="label">Microcontents</div>
                <div class="value">${blueprintData.totalContents}</div>
            </div>
            <div class="info-card">
                <div class="label">Sections</div>
                <div class="value">${blueprintData.sections.length}</div>
            </div>
        </div>

        <h2 class="section-title">Course Structure</h2>

        ${blueprintData.sections.map(section => `
            <div class="course-section">
                <div class="section-header">
                    <span>Section ${section.number}: ${section.title}${section.gdtaMapping ? ` <span class="gdta-ref">(${section.gdtaMapping.displayText})</span>` : ''}</span>
                    <span class="section-badge">${section.contentCount} contents</span>
                </div>
                ${section.contents.length > 0 ? `
                    <table class="content-table">
                        <thead>
                            <tr>
                                <th style="width: 40px;">#</th>
                                <th>Title</th>
                                <th style="width: 80px;">Type</th>
                                <th style="width: 80px;">Level</th>
                                <th style="width: 80px;">Source</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${section.contents.map(content => `
                                <tr>
                                    <td><div class="content-number">${content.number}</div></td>
                                    <td>${content.title}</td>
                                    <td><span class="badge badge-${content.type.toLowerCase().replace(/\s+/g, '_')}">${this.translateContentType(content.type)}</span></td>
                                    <td><span class="badge badge-${content.difficulty.toLowerCase()}">${this.translateDifficulty(content.difficulty)}</span></td>
                                    <td style="color: #666; font-size: 0.8rem;">${content.source}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                ` : `
                    <div class="empty-section">No contents in this section</div>
                `}
            </div>
        `).join('')}
    </div>
</body>
</html>`;

    return html;
  }
  
  static translateContentType(type) {
    const translations = {
      'Video': 'Video',
      'Audio': 'Audio', 
      'Documento PDF': 'PDF',
      'Infografica': 'Infographic',
      'Quiz': 'Quiz',
      'Caso di Studio': 'Case Study',
      'Scenario': 'Scenario',
      'Attivita': 'Task',
      'Tutorial': 'Tutorial'
    };
    return translations[type] || type;
  }
  
  static translateDifficulty(difficulty) {
    const translations = {
      'Principiante': 'Beginner',
      'Intermedio': 'Intermediate', 
      'Avanzato': 'Advanced',
      'beginner': 'Beginner',
      'intermediate': 'Intermediate',
      'advanced': 'Advanced'
    };
    return translations[difficulty] || difficulty;
  }
}

module.exports = PDFGenerator;