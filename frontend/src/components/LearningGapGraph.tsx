import React, { useState } from 'react';
import { DiagnosticAnalysis } from '../services/api';
import { ActionButton } from './common/InstitutionalUI';

interface LearningGapGraphProps {
  analysis: DiagnosticAnalysis;
  onNavigate: (screen: string, param?: any) => void;
  onRunCheck: () => void;
}

export const LearningGapGraph: React.FC<LearningGapGraphProps> = ({
  analysis,
  onNavigate,
  onRunCheck
}) => {
  const [selectedNodeKey, setSelectedNodeKey] = useState<string>('hypothesis');

  const primaryHyp = analysis.hypotheses[0] || {
    description: "Prerequisite gap under investigation",
    confidence: "Medium",
    status: "open",
    prerequisite_skill: "Place-Value Decomposition"
  };

  const nodes = [
    {
      key: 'skill',
      category: 'OBSERVED SKILL',
      title: analysis.skill_title,
      summary: `Domain: ${analysis.domain.toUpperCase()}`,
      detail: `Observed performance: ${analysis.observed_performance}`,
      type: 'observed', // Navy
      borderStyle: 'border-solid border-[#17365D]'
    },
    {
      key: 'prerequisite',
      category: 'PREREQUISITE DEPENDENCY',
      title: primaryHyp.prerequisite_skill,
      summary: 'Required foundational precursor',
      detail: `Curricular dependency required before fluency in ${analysis.skill_title} can be sustained.`,
      type: 'prerequisite', // Navy
      borderStyle: 'border-solid border-[#17365D]'
    },
    {
      key: 'evidence',
      category: 'OBSERVED EVIDENCE',
      title: `${analysis.observed_performance}`,
      summary: `${analysis.observed_pattern.successful_task_ids.length} correct, ${analysis.observed_pattern.failed_task_ids.length} incorrect`,
      detail: `Tasks evaluated: ${analysis.observed_pattern.supporting_task_ids.join(', ')}. Teacher notes: ${analysis.observed_pattern.teacher_observations.join('; ')}`,
      type: 'observed', // Navy
      borderStyle: 'border-solid border-[#17365D]'
    },
    {
      key: 'pattern',
      category: 'ERROR PATTERN',
      title: 'Non-Random Error Distribution',
      summary: analysis.observed_pattern.description,
      detail: analysis.observed_pattern.evidence_summary,
      type: 'observed', // Navy
      borderStyle: 'border-solid border-[#17365D]'
    },
    {
      key: 'hypothesis',
      category: 'AI HYPOTHESIS (TESTABLE)',
      title: `Possible Gap: ${primaryHyp.prerequisite_skill}`,
      summary: `Confidence: ${primaryHyp.confidence} • Status: ${primaryHyp.status.toUpperCase()}`,
      detail: `${primaryHyp.description} Rationale: ${primaryHyp.confidence_rationale}`,
      type: 'hypothesis', // Maroon Dashed
      borderStyle: 'border-dashed border-2 border-[#8A2F35]'
    },
    {
      key: 'check',
      category: 'DIAGNOSTIC CHECK',
      title: `3 Targeted Tasks: ${analysis.next_diagnostic_check.prerequisite_skill}`,
      summary: analysis.next_diagnostic_check.status === 'completed' 
        ? `Result: ${analysis.next_diagnostic_check.score_summary}` 
        : 'Status: Pending Verification',
      detail: analysis.next_diagnostic_check.purpose,
      type: 'check', // Ochre
      borderStyle: 'border-solid border-[#A87932]'
    },
    {
      key: 'move',
      category: 'NEXT LEARNING MOVE',
      title: 'Instructional Action',
      summary: analysis.next_learning_move.instructional_step,
      detail: `${analysis.next_learning_move.description} Rationale: ${analysis.next_learning_move.rationale}`,
      type: 'move', // Muted Green
      borderStyle: 'border-solid border-2 border-[#4F7658]'
    }
  ];

  const selectedNode = nodes.find(n => n.key === selectedNodeKey) || nodes[4];

  return (
    <div className="space-y-6 font-sans">
      
      {/* Top Explanation & Legend */}
      <div className="bg-[#FCFBF8] border border-[#D9D3C7] rounded-[4px] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
        <div>
          <h3 className="font-serif font-bold text-base text-[#17365D]">
            Structured Learning Gap Graph
          </h3>
          <p className="text-[#666666] mt-0.5">
            Relational reasoning map connecting observed performance, detected error patterns, prerequisite hypotheses, and instructional moves.
          </p>
        </div>

        {/* Legend (Section 28) */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-[#FCFBF8] border-solid border border-[#17365D] rounded-xs" />
            <span className="font-semibold text-[#17365D]">Observed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-[#FCFBF8] border-dashed border-2 border-[#8A2F35] rounded-xs" />
            <span className="font-semibold text-[#8A2F35]">AI Hypothesis</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-[#FAF4EB] border-solid border border-[#A87932] rounded-xs" />
            <span className="font-semibold text-[#8F6627]">Diagnostic Check</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-[#EDF3EE] border-solid border border-[#4F7658] rounded-xs" />
            <span className="font-semibold text-[#3B5E43]">Learning Move</span>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Graph Flow + Node Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Graph Flow (7 cols) */}
        <div className="lg:col-span-7 bg-[#FCFBF8] border border-[#D9D3C7] rounded-[4px] p-6 space-y-3">
          {nodes.map((node, index) => {
            const isSelected = node.key === selectedNodeKey;
            return (
              <React.Fragment key={node.key}>
                <div 
                  onClick={() => setSelectedNodeKey(node.key)}
                  className={`p-3.5 rounded-[4px] cursor-pointer transition-all ${node.borderStyle} ${
                    isSelected ? 'ring-2 ring-[#17365D] shadow-xs' : 'hover:bg-[#F1EEE7]'
                  } ${
                    node.type === 'observed' ? 'bg-[#FCFBF8]' : 
                    node.type === 'hypothesis' ? 'bg-[#FCFBF8]' : 
                    node.type === 'check' ? 'bg-[#FAF4EB]' : 'bg-[#EDF3EE]'
                  }`}
                >
                  <div className="flex items-baseline justify-between mb-1">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${
                      node.type === 'observed' ? 'text-[#17365D]' : 
                      node.type === 'hypothesis' ? 'text-[#8A2F35]' : 
                      node.type === 'check' ? 'text-[#8F6627]' : 'text-[#3B5E43]'
                    }`}>
                      {node.category}
                    </span>
                    <span className="text-[10px] text-[#737373] font-mono">Step {index + 1}</span>
                  </div>

                  <p className="font-serif font-bold text-sm text-[#252525]">
                    {node.title}
                  </p>
                  <p className="text-xs text-[#525252] mt-0.5">
                    {node.summary}
                  </p>
                </div>

                {index < nodes.length - 1 && (
                  <div className="flex justify-center py-0.5">
                    <span className="text-xs font-mono text-[#B8B0A2]">│</span>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Selected Node Details & Evidence Inspector (5 cols) */}
        <div className="lg:col-span-5 bg-[#FCFBF8] border border-[#D9D3C7] rounded-[4px] p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="border-b border-[#D9D3C7] pb-2 mb-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#8A2F35]">
                Node Inspector
              </span>
              <h4 className="font-serif font-bold text-base text-[#17365D]">
                {selectedNode.title}
              </h4>
              <p className="text-xs text-[#737373]">{selectedNode.category}</p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-[#F1EEE7] border border-[#D9D3C7] rounded-[4px] p-3 text-[#525252]">
                <span className="font-bold text-[#252525] block mb-1 uppercase tracking-wide text-[10px]">
                  Reasoning Specification:
                </span>
                <p className="leading-relaxed">{selectedNode.detail}</p>
              </div>

              {selectedNode.key === 'pattern' && (
                <div className="space-y-1.5">
                  <p className="font-semibold text-[#252525]">Task Distribution Trace:</p>
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                    <div className="p-2 bg-[#EDF3EE] border border-[#C6D8CA] rounded-[3px] text-[#3B5E43]">
                      Non-Regrouping Tasks: 2/2 Correct ✓
                    </div>
                    <div className="p-2 bg-[#F9EDED] border border-[#DFC1C1] rounded-[3px] text-[#873F3F]">
                      Regrouping Tasks: 0/2 Correct ✕
                    </div>
                  </div>
                </div>
              )}

              {selectedNode.key === 'hypothesis' && (
                <div className="space-y-2">
                  <div className="p-2.5 bg-[#FAF4EB] border border-[#E5D8C1] rounded-[3px] text-[#8F6627]">
                    <span className="font-bold block uppercase tracking-wider text-[10px]">Hypothesis Status:</span>
                    <span className="font-serif font-bold text-sm uppercase">{primaryHyp.status}</span>
                  </div>
                  <ActionButton 
                    variant="maroon" 
                    size="sm" 
                    onClick={onRunCheck}
                    className="w-full"
                  >
                    Run 3-Task Diagnostic Check →
                  </ActionButton>
                </div>
              )}

              {selectedNode.key === 'check' && (
                <div className="space-y-2">
                  <p className="text-[#525252]">
                    Tasks isolate {analysis.next_diagnostic_check.prerequisite_skill} from complex multi-digit subtraction notation.
                  </p>
                  <ActionButton 
                    variant="primary" 
                    size="sm" 
                    onClick={onRunCheck}
                    className="w-full"
                  >
                    {analysis.next_diagnostic_check.status === 'completed' ? 'Re-Run Diagnostic Check' : 'Administer Diagnostic Check Now'}
                  </ActionButton>
                </div>
              )}

              {selectedNode.key === 'move' && (
                <div className="p-3 bg-[#EDF3EE] border border-[#C6D8CA] rounded-[4px] text-[#3B5E43] space-y-1">
                  <span className="font-bold uppercase tracking-wider text-[10px] block">Actionable Directive:</span>
                  <p className="font-serif text-sm font-semibold">{analysis.next_learning_move.instructional_step}</p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-[#D9D3C7] text-[11px] text-[#737373]">
            Click any node in the flow to trace reasoning evidence and instructional logic.
          </div>
        </div>

      </div>

    </div>
  );
};
