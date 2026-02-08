import { useState } from 'react';
import { X, RotateCw, Check, Search, Filter } from 'lucide-react';

interface OCRDocument {
  id: number;
  subjectCode: string;
  subjectTitle: string;
  yearSem: string;
  fileType: string;
  dateAdded: string;
  ocrText: string;
  uncertainWords: string[];
}

export function NotesOCRReview() {
  const [selectedDocument, setSelectedDocument] = useState<OCRDocument | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterYearSem, setFilterYearSem] = useState('all');
  const [filterDateRange, setFilterDateRange] = useState('all');

  // Mock OCR documents
  const ocrDocuments: OCRDocument[] = [
    {
      id: 1,
      subjectCode: 'COMP 302',
      subjectTitle: 'Analysis of Algorithms',
      yearSem: 'III/I',
      fileType: 'Handwritten Notes',
      dateAdded: '2024-01-15',
      ocrText: `Time Complexity:
• Search: O(log n) average, O(n) worst case
• Insert: O(log n) average, O(n) worst case
• Delete: O(log n) average, O(n) worst case

Note: The worst case occurs when the tree becomes unbalanced (essentially a linked list).

Balanced BST variants like AVL trees and Red-Black trees guarantee O(log n) operations.`,
      uncertainWords: ['unbalanced', 'variants', 'essentially']
    },
    {
      id: 2,
      subjectCode: 'COMP 215',
      subjectTitle: 'Database Management Systems',
      yearSem: 'II/II',
      fileType: 'Scanned Document',
      dateAdded: '2024-01-14',
      ocrText: `Database Normalization

First Normal Form (1NF):
• Eliminate repeating groups
• Create separate table for related data
• Identify each record with primary key

Second Normal Form (2NF):
• Meet all requirements of 1NF
• Remove subsets of data that apply to multiple rows
• Create separate tables for values that apply to multiple records`,
      uncertainWords: ['subsets', 'multiple']
    },
    {
      id: 3,
      subjectCode: 'COMP 314',
      subjectTitle: 'Computer Networks',
      yearSem: 'III/II',
      fileType: 'Handwritten Notes',
      dateAdded: '2024-01-13',
      ocrText: `OSI Model Layers:

7. Application Layer - End user layer
6. Presentation Layer - Syntax layer
5. Session Layer - Synchronization
4. Transport Layer - End-to-end connections
3. Network Layer - Packets
2. Data Link Layer - Frames
1. Physical Layer - Bits`,
      uncertainWords: ['Synchronization', 'connections']
    },
    {
      id: 4,
      subjectCode: 'COMP 401',
      subjectTitle: 'Artificial Intelligence',
      yearSem: 'IV/I',
      fileType: 'Diagram',
      dateAdded: '2024-01-12',
      ocrText: `Search Algorithms:

Breadth-First Search (BFS):
- Complete: Yes
- Optimal: Yes (if cost = 1)
- Time: O(b^d)
- Space: O(b^d)

Depth-First Search (DFS):
- Complete: No
- Optimal: No
- Time: O(b^m)
- Space: O(bm)`,
      uncertainWords: ['Optimal', 'Complete']
    },
    {
      id: 5,
      subjectCode: 'COMP 202',
      subjectTitle: 'Data Structures',
      yearSem: 'II/I',
      fileType: 'Handwritten Notes',
      dateAdded: '2024-01-10',
      ocrText: `Linked List Operations:

Insertion at beginning: O(1)
Insertion at end: O(n)
Deletion at beginning: O(1)
Deletion at end: O(n)
Search: O(n)

Advantages:
• Dynamic size
• Ease of insertion/deletion

Disadvantages:
• Random access not allowed
• Extra memory for pointers`,
      uncertainWords: ['Disadvantages', 'pointers']
    }
  ];

  // Filter documents based on search and filters
  const filteredDocuments = ocrDocuments.filter(doc => {
    const matchesSearch = searchQuery === '' || 
      doc.subjectCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.subjectTitle.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesYearSem = filterYearSem === 'all' || doc.yearSem === filterYearSem;
    
    // Date range filter
    let matchesDate = true;
    if (filterDateRange !== 'all') {
      const docDate = new Date(doc.dateAdded);
      const today = new Date();
      const daysDiff = Math.floor((today.getTime() - docDate.getTime()) / (1000 * 60 * 60 * 24));
      
      switch (filterDateRange) {
        case 'today':
          matchesDate = daysDiff === 0;
          break;
        case 'week':
          matchesDate = daysDiff <= 7;
          break;
        case 'month':
          matchesDate = daysDiff <= 30;
          break;
        case 'oldest':
          matchesDate = daysDiff >= 30;
          break;
        case 'newest':
          matchesDate = daysDiff < 30;
          break;
      }
    }
    
    return matchesSearch && matchesYearSem && matchesDate;
  });

  const handleDocumentSelect = (doc: OCRDocument) => {
    setSelectedDocument(doc);
    setExtractedText(doc.ocrText);
  };

  // Render text with highlighted uncertain words
  const renderHighlightedText = () => {
    if (!selectedDocument) return extractedText;
    
    const words = extractedText.split(/(\s+)/);
    return words.map((word, index) => {
      const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
      const isUncertain = selectedDocument.uncertainWords.some(uncertain => 
        cleanWord.includes(uncertain.toLowerCase())
      );
      
      if (isUncertain) {
        return (
          <span key={index} className="bg-orange-600/20 text-orange-400 rounded px-0.5">
            {word}
          </span>
        );
      }
      return word;
    });
  };

  const handleReject = () => {
    const reason = window.confirm('Are you sure you want to reject this document?');
    if (reason) {
      console.log('Document rejected');
      // In production: send rejection to backend
      alert('Document rejected');
    }
  };

  const handleRegenerate = () => {
    console.log('Regenerating OCR...');
    // In production: trigger new OCR extraction
    alert('Regenerating OCR text...');
  };

  const handleApprove = () => {
    console.log('Approving and indexing:', extractedText);
    // In production: send approved text to backend for indexing
    alert('Document approved and queued for indexing!');
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#121212]">
      {/* Header */}
      <div className="p-6 lg:p-8 pb-6">
        <h1 className="text-3xl lg:text-4xl text-white mb-2">Notes & OCR Review</h1>
        <p className="text-[#A0A0A0]">Review and verify AI-extracted text from handwritten notes</p>
      </div>

      {/* Split Screen Content */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 px-6 lg:px-8 overflow-hidden pb-24 lg:pb-28">
        {/* Left Column - Document List with Filters */}
        <div className="flex-1 flex flex-col bg-[#2D2E30] rounded-xl border border-[#3D3E40] overflow-hidden min-h-[400px] lg:min-h-0">
          <div className="px-6 py-4 border-b border-[#3D3E40]">
            <h2 className="text-white text-lg mb-4">Documents Pending Review</h2>
            
            {/* Search Bar */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A0A0A0]" />
              <input
                type="text"
                placeholder="Search by subject code or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#1A1B1E] border border-[#3D3E40] rounded-lg pl-10 pr-4 py-2 text-white placeholder-[#A0A0A0] focus:outline-none focus:border-white/30 text-sm"
              />
            </div>

            {/* Filters */}
            <div className="grid grid-cols-2 gap-2">
              <select
                value={filterYearSem}
                onChange={(e) => setFilterYearSem(e.target.value)}
                className="bg-[#1A1B1E] border border-[#3D3E40] rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-white/30"
              >
                <option value="all">Year/Sem</option>
                <option value="I/I">I/I</option>
                <option value="I/II">I/II</option>
                <option value="II/I">II/I</option>
                <option value="II/II">II/II</option>
                <option value="III/I">III/I</option>
                <option value="III/II">III/II</option>
                <option value="IV/I">IV/I</option>
                <option value="IV/II">IV/II</option>
              </select>

              <select
                value={filterDateRange}
                onChange={(e) => setFilterDateRange(e.target.value)}
                className="bg-[#1A1B1E] border border-[#3D3E40] rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-white/30"
              >
                <option value="all">Date</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="oldest">Oldest</option>
                <option value="newest">Newest</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-[#2D2E30] border-b border-[#3D3E40]">
                <tr>
                  <th className="text-left px-4 py-3 text-[#A0A0A0] text-xs font-medium">Subject Code</th>
                  <th className="text-left px-4 py-3 text-[#A0A0A0] text-xs font-medium">Title</th>
                  <th className="text-left px-4 py-3 text-[#A0A0A0] text-xs font-medium">Year/Sem</th>
                  <th className="text-left px-4 py-3 text-[#A0A0A0] text-xs font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-[#A0A0A0] text-sm">
                      No documents found matching your filters
                    </td>
                  </tr>
                ) : (
                  filteredDocuments.map((doc) => (
                    <tr
                      key={doc.id}
                      onClick={() => handleDocumentSelect(doc)}
                      className={`border-b border-[#3D3E40] cursor-pointer transition-colors ${
                        selectedDocument?.id === doc.id 
                          ? 'bg-[#3D3E40]' 
                          : 'hover:bg-[#3D3E40]/30'
                      }`}
                    >
                      <td className="px-4 py-3 text-white text-sm">{doc.subjectCode}</td>
                      <td className="px-4 py-3 text-white text-sm">{doc.subjectTitle}</td>
                      <td className="px-4 py-3 text-[#A0A0A0] text-sm">{doc.yearSem}</td>
                      <td className="px-4 py-3 text-[#A0A0A0] text-sm">{doc.dateAdded}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Results Count */}
          <div className="px-6 py-3 border-t border-[#3D3E40] bg-[#1A1B1E]">
            <p className="text-xs text-[#A0A0A0]">
              Showing {filteredDocuments.length} of {ocrDocuments.length} documents
            </p>
          </div>
        </div>

        {/* Right Column - Extracted Text */}
        <div className="flex-1 flex flex-col bg-[#2D2E30] rounded-xl border border-[#3D3E40] overflow-hidden min-h-[400px] lg:min-h-0">
          <div className="px-6 py-4 border-b border-[#3D3E40]">
            <h2 className="text-white text-lg">Extracted Text</h2>
            <p className="text-[#A0A0A0] text-sm mt-1">
              {selectedDocument ? (
                <>
                  {selectedDocument.subjectCode} - {selectedDocument.subjectTitle} • <span className="text-orange-400">Highlighted words</span> indicate low confidence
                </>
              ) : (
                'Select a document to review'
              )}
            </p>
          </div>
          <div className="flex-1 overflow-auto p-6">
            {selectedDocument ? (
              <div className="w-full h-full font-mono text-sm leading-relaxed whitespace-pre-wrap">
                {renderHighlightedText()}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-[#A0A0A0]">
                <div className="text-center">
                  <Filter className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Select a document from the table to view and edit extracted text</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Action Bar - Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-72 bg-[#1E1F20] border-t border-[#2D2E30] px-6 lg:px-8 py-4 z-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="text-[#A0A0A0] text-sm">
            {selectedDocument ? (
              <>Document ID: #OCR-{selectedDocument.id} • Uploaded: {selectedDocument.dateAdded}</>
            ) : (
              'No document selected'
            )}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button 
              onClick={handleReject}
              disabled={!selectedDocument}
              className="flex items-center gap-2 px-5 py-2.5 border border-red-600/50 text-red-400 rounded-lg hover:bg-red-600/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="w-4 h-4" />
              Reject
            </button>
            <button 
              onClick={handleRegenerate}
              disabled={!selectedDocument}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#3D3E40] hover:bg-[#4D4E50] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCw className="w-4 h-4" />
              Regenerate
            </button>
            <button 
              onClick={handleApprove}
              disabled={!selectedDocument}
              className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="w-4 h-4" />
              Approve & Index
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}