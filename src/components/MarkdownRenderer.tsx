import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  // Helper to parse block-level elements
  const renderBlocks = (text: string) => {
    // Split into lines to identify structures
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    
    let inList = false;
    let listItems: string[] = [];
    let isOrdered = false;
    
    let inCodeBlock = false;
    let codeLanguage = '';
    let codeLines: string[] = [];
    
    let inTable = false;
    let tableHeaders: string[] = [];
    let tableRows: string[][] = [];

    const flushList = (key: number) => {
      if (listItems.length === 0) return null;
      const Tag = isOrdered ? 'ol' : 'ul';
      const el = (
        <Tag key={`list-${key}`} className={isOrdered ? 'list-decimal pl-6 mb-4 space-y-1' : 'list-disc pl-6 mb-4 space-y-1'}>
          {listItems.map((item, idx) => (
            <li key={idx} className="text-gray-300">
              {renderInline(item)}
            </li>
          ))}
        </Tag>
      );
      listItems = [];
      inList = false;
      return el;
    };

    const flushCodeBlock = (key: number) => {
      if (codeLines.length === 0) return null;
      const codeText = codeLines.join('\n');
      const el = (
        <div key={`code-${key}`} className="relative my-4 rounded-xl overflow-hidden border border-white/10 bg-[#0f0f11] font-mono text-xs">
          <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10 text-[10px] uppercase text-gray-400 font-semibold tracking-wider">
            <span>{codeLanguage || 'code'}</span>
            <button 
              id={`btn-copy-code-${key}`}
              onClick={() => navigator.clipboard.writeText(codeText)}
              className="hover:text-indigo-400 transition-colors cursor-pointer"
            >
              Salin
            </button>
          </div>
          <pre className="p-4 overflow-x-auto text-gray-200 leading-relaxed font-mono">
            <code>{codeText}</code>
          </pre>
        </div>
      );
      codeLines = [];
      inCodeBlock = false;
      return el;
    };

    const flushTable = (key: number) => {
      if (tableRows.length === 0 && tableHeaders.length === 0) return null;
      const el = (
        <div key={`table-${key}`} className="overflow-x-auto my-4 rounded-xl border border-white/10">
          <table className="w-full text-left border-collapse text-xs md:text-sm">
            {tableHeaders.length > 0 && (
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  {tableHeaders.map((h, idx) => (
                    <th key={idx} className="p-3 font-semibold text-white border-r border-white/10 last:border-r-0">
                      {renderInline(h)}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody className="divide-y divide-white/5">
              {tableRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-white/[0.02] transition-colors">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="p-3 text-gray-300 border-r border-white/10 last:border-r-0">
                      {renderInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableHeaders = [];
      tableRows = [];
      inTable = false;
      return el;
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Code Block Toggle
      if (trimmed.startsWith('```')) {
        if (inCodeBlock) {
          const el = flushCodeBlock(i);
          if (el) elements.push(el);
        } else {
          // Flush list if any
          const listEl = flushList(i);
          if (listEl) elements.push(listEl);
          // Flush table if any
          const tableEl = flushTable(i);
          if (tableEl) elements.push(tableEl);

          inCodeBlock = true;
          codeLanguage = trimmed.slice(3).trim();
          codeLines = [];
        }
        continue;
      }

      if (inCodeBlock) {
        codeLines.push(line);
        continue;
      }

      // Headers (H1 - H4)
      if (trimmed.startsWith('#') && !inCodeBlock) {
        // Flush existing lists or tables
        const listEl = flushList(i);
        if (listEl) elements.push(listEl);
        const tableEl = flushTable(i);
        if (tableEl) elements.push(tableEl);

        const level = (trimmed.match(/^#+/) || [''])[0].length;
        const text = trimmed.slice(level).trim();
        
        if (level === 1) {
          elements.push(<h1 key={i} className="text-xl md:text-2xl font-bold font-display text-white mt-6 mb-3 tracking-tight border-b border-white/5 pb-1">{renderInline(text)}</h1>);
        } else if (level === 2) {
          elements.push(<h2 key={i} className="text-lg md:text-xl font-bold font-display text-indigo-300 mt-5 mb-2">{renderInline(text)}</h2>);
        } else if (level === 3) {
          elements.push(<h3 key={i} className="text-base md:text-lg font-semibold text-gray-200 mt-4 mb-2">{renderInline(text)}</h3>);
        } else {
          elements.push(<h4 key={i} className="text-sm md:text-base font-semibold text-gray-300 mt-3 mb-1">{renderInline(text)}</h4>);
        }
        continue;
      }

      // Blockquotes
      if (trimmed.startsWith('>') && !inCodeBlock) {
        const listEl = flushList(i);
        if (listEl) elements.push(listEl);
        const tableEl = flushTable(i);
        if (tableEl) elements.push(tableEl);

        const quoteText = line.replace(/^\s*>\s?/, '');
        elements.push(
          <blockquote key={i} className="border-l-4 border-indigo-500 pl-4 py-1 my-4 italic text-gray-400 bg-white/[0.02] rounded-r-lg">
            {renderInline(quoteText)}
          </blockquote>
        );
        continue;
      }

      // Horizontal Rule
      if ((trimmed === '---' || trimmed === '***' || trimmed === '___') && !inCodeBlock) {
        const listEl = flushList(i);
        if (listEl) elements.push(listEl);
        const tableEl = flushTable(i);
        if (tableEl) elements.push(tableEl);

        elements.push(<hr key={i} className="my-6 border-t border-white/10" />);
        continue;
      }

      // Unordered Lists
      if ((trimmed.startsWith('- ') || trimmed.startsWith('* ')) && !inCodeBlock) {
        if (!inList || isOrdered) {
          // Flush existing ordered list if any
          const listEl = flushList(i);
          if (listEl) elements.push(listEl);
          
          inList = true;
          isOrdered = false;
        }
        listItems.push(trimmed.slice(2));
        continue;
      }

      // Ordered Lists
      if (/^\d+\.\s/.test(trimmed) && !inCodeBlock) {
        if (!inList || !isOrdered) {
          // Flush existing unordered list if any
          const listEl = flushList(i);
          if (listEl) elements.push(listEl);
          
          inList = true;
          isOrdered = true;
        }
        const textContent = trimmed.replace(/^\d+\.\s/, '');
        listItems.push(textContent);
        continue;
      }

      // Tables (simple markdown parser)
      if (trimmed.startsWith('|') && !inCodeBlock) {
        // Flush lists
        const listEl = flushList(i);
        if (listEl) elements.push(listEl);

        const parts = trimmed.split('|').map(p => p.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
        
        // Check if it is a separator line e.g., |---|---|
        const isSeparator = parts.every(part => /^:?-+:?$/.test(part));
        
        if (isSeparator) {
          // It's just a spacer line, continue
          continue;
        }

        if (!inTable) {
          inTable = true;
          tableHeaders = parts;
          tableRows = [];
        } else {
          tableRows.push(parts);
        }
        continue;
      }

      // If we are in table but line doesn't start with |, flush table
      if (inTable && !trimmed.startsWith('|')) {
        const tableEl = flushTable(i);
        if (tableEl) elements.push(tableEl);
      }

      // Normal paragraph or break
      if (trimmed === '') {
        const listEl = flushList(i);
        if (listEl) elements.push(listEl);
        
        const tableEl = flushTable(i);
        if (tableEl) elements.push(tableEl);
        
        // Add vertical spacing
        elements.push(<div key={`space-${i}`} className="h-2"></div>);
      } else {
        // Normal text line
        if (inList) {
          // If we were in a list, append to last item or flush list
          const listEl = flushList(i);
          if (listEl) elements.push(listEl);
        }

        elements.push(
          <p key={i} className="text-gray-200 leading-relaxed mb-3">
            {renderInline(line)}
          </p>
        );
      }
    }

    // Flush any remaining blocks
    const listEl = flushList(lines.length);
    if (listEl) elements.push(listEl);
    
    const codeEl = flushCodeBlock(lines.length);
    if (codeEl) elements.push(codeEl);

    const tableEl = flushTable(lines.length);
    if (tableEl) elements.push(tableEl);

    return elements;
  };

  // Helper to parse inline styles (bold, italic, code)
  const renderInline = (text: string): React.ReactNode => {
    if (!text) return '';
    
    // Replace markdown inline styles with React elements recursively or sequentially
    const parts: React.ReactNode[] = [];
    let currentText = text;
    let index = 0;

    while (currentText.length > 0) {
      // Find nearest syntax match
      const boldMatch = currentText.match(/\*\*([^*]+)\*\*/);
      const italicMatch = currentText.match(/\*([^*]+)\*/);
      const inlineCodeMatch = currentText.match(/`([^`]+)`/);

      const boldIndex = boldMatch ? currentText.indexOf(boldMatch[0]) : -1;
      const italicIndex = italicMatch ? currentText.indexOf(italicMatch[0]) : -1;
      const codeIndex = inlineCodeMatch ? currentText.indexOf(inlineCodeMatch[0]) : -1;

      // Find which one is first
      const indices = [
        { type: 'bold', index: boldIndex, match: boldMatch },
        { type: 'italic', index: italicIndex, match: italicMatch },
        { type: 'code', index: codeIndex, match: inlineCodeMatch }
      ].filter(item => item.index !== -1);

      if (indices.length === 0) {
        parts.push(<span key={index++}>{currentText}</span>);
        break;
      }

      indices.sort((a, b) => a.index - b.index);
      const first = indices[0];

      // Add text before the match
      if (first.index > 0) {
        parts.push(<span key={index++}>{currentText.substring(0, first.index)}</span>);
      }

      // Add the matched item styled
      if (first.type === 'bold' && first.match) {
        parts.push(<strong key={index++} className="font-bold text-white">{first.match[1]}</strong>);
      } else if (first.type === 'italic' && first.match) {
        parts.push(<em key={index++} className="italic text-indigo-200">{first.match[1]}</em>);
      } else if (first.type === 'code' && first.match) {
        parts.push(<code key={index++} className="font-mono text-xs px-1.5 py-0.5 rounded bg-white/10 text-indigo-300 border border-white/5">{first.match[1]}</code>);
      }

      // Advance
      currentText = currentText.substring(first.index + first.match![0].length);
    }

    return <>{parts}</>;
  };

  return (
    <div className="markdown-body select-text">
      {renderBlocks(content)}
    </div>
  );
}
