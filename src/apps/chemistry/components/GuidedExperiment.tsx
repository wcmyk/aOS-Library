/**
 * GuidedExperiment – step-by-step experiment panel.
 * Shows current step instructions, progress, hints, and completion feedback.
 */

import React, { useState } from 'react';
import { useChemLabStore } from '../state/useChemLabStore';
import { EXPERIMENT_TEMPLATES } from '../data/experiments';

function StepIndicator({ total, current, completed }: { total: number; current: number; completed: string[] }) {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '6px 0' }}>
      {Array.from({ length: total }, (_, i) => {
        const done = completed.includes(`step_${i + 1}`) || i < current;
        const active = i === current;
        return (
          <div key={i} style={{
            width: active ? 24 : 16,
            height: 6, borderRadius: 3,
            background: done ? '#34d399' : active ? '#7dd3fc' : 'rgba(60,80,110,0.6)',
            transition: 'all 0.3s',
            flexShrink: 0,
          }} />
        );
      })}
    </div>
  );
}

export function GuidedExperimentPanel() {
  const {
    currentExperimentId,
    currentStepIndex,
    completedSteps,
    mode,
    completeStep,
    abandonExperiment,
    setMode,
    startExperiment,
  } = useChemLabStore();

  const [showHint, setShowHint] = useState(false);
  const [selectedExp, setSelectedExp] = useState<string | null>(null);

  // Experiment selection view
  if (mode === 'sandbox' || !currentExperimentId) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', height: '100%',
        background: 'rgba(8,18,38,0.9)', overflowY: 'auto',
      }}>
        <div style={{
          padding: '10px 12px 8px',
          borderBottom: '1px solid rgba(100,130,170,0.12)',
          flexShrink: 0,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#7dd3fc', letterSpacing: '0.05em', fontFamily: 'SF Pro Display, Inter, sans-serif' }}>
            GUIDED EXPERIMENTS
          </div>
          <div style={{ fontSize: 9, color: 'rgba(148,163,184,0.6)', marginTop: 3, fontFamily: 'SF Pro Display, Inter, sans-serif' }}>
            Currently in sandbox mode.
          </div>
        </div>
        <div style={{ padding: '8px 10px', flex: 1, overflowY: 'auto' }}>
          {EXPERIMENT_TEMPLATES.map((exp) => (
            <div
              key={exp.id}
              onClick={() => setSelectedExp(selectedExp === exp.id ? null : exp.id)}
              style={{
                borderRadius: 6,
                border: `1px solid ${selectedExp === exp.id ? 'rgba(125,211,252,0.35)' : 'rgba(100,130,170,0.15)'}`,
                background: selectedExp === exp.id ? 'rgba(15,35,65,0.8)' : 'rgba(12,22,45,0.6)',
                padding: '8px 10px', marginBottom: 6,
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#e2e8f0', fontFamily: 'SF Pro Display, Inter, sans-serif' }}>
                    {exp.name}
                  </div>
                  <div style={{ display: 'flex', gap: 5, marginTop: 3 }}>
                    <span style={{
                      fontSize: 9, padding: '1px 6px', borderRadius: 10,
                      background: 'rgba(125,211,252,0.1)', color: '#7dd3fc',
                      border: '1px solid rgba(125,211,252,0.2)',
                      fontFamily: 'SF Pro Display, Inter, sans-serif',
                    }}>
                      {exp.category.replace(/_/g, ' ')}
                    </span>
                    <span style={{
                      fontSize: 9, padding: '1px 6px', borderRadius: 10,
                      background: exp.difficulty === 'beginner' ? 'rgba(52,211,153,0.1)' : exp.difficulty === 'intermediate' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                      color: exp.difficulty === 'beginner' ? '#34d399' : exp.difficulty === 'intermediate' ? '#f59e0b' : '#ef4444',
                      border: `1px solid ${exp.difficulty === 'beginner' ? 'rgba(52,211,153,0.25)' : exp.difficulty === 'intermediate' ? 'rgba(245,158,11,0.25)' : 'rgba(239,68,68,0.25)'}`,
                      fontFamily: 'SF Pro Display, Inter, sans-serif',
                    }}>
                      {exp.difficulty}
                    </span>
                    <span style={{ fontSize: 9, color: 'rgba(148,163,184,0.5)', fontFamily: 'SF Pro Display, Inter, sans-serif' }}>
                      ~{exp.estimatedMinutes} min
                    </span>
                  </div>
                </div>
                <svg width="10" height="10" viewBox="0 0 10 10" style={{
                  opacity: 0.4, flexShrink: 0, marginTop: 2,
                  transform: selectedExp === exp.id ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s',
                }}>
                  <path d="M 2 3 L 5 7 L 8 3" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>

              {selectedExp === exp.id && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 9, color: 'rgba(148,163,184,0.7)', lineHeight: 1.5, marginBottom: 8, fontFamily: 'SF Pro Display, Inter, sans-serif' }}>
                    {exp.description}
                  </div>
                  <div style={{ fontSize: 9, color: 'rgba(148,163,184,0.6)', marginBottom: 4, fontFamily: 'SF Pro Display, Inter, sans-serif' }}>
                    {exp.steps.length} steps &nbsp;·&nbsp; {exp.learningObjectives.length} objectives
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); startExperiment(exp.id); }}
                    style={{
                      width: '100%', padding: '6px 0', borderRadius: 5, border: 'none',
                      background: 'rgba(125,211,252,0.18)', color: '#7dd3fc',
                      fontSize: 10, cursor: 'pointer', fontWeight: 700,
                      fontFamily: 'SF Pro Display, Inter, sans-serif',
                      transition: 'background 0.15s',
                    }}
                  >
                    Start Experiment
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const template = EXPERIMENT_TEMPLATES.find((e) => e.id === currentExperimentId);
  if (!template) return null;

  const step = template.steps[currentStepIndex];
  const isLastStep = currentStepIndex >= template.steps.length - 1;
  const allDone = completedSteps.length >= template.steps.length;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: 'rgba(8,18,38,0.9)',
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 12px 8px',
        borderBottom: '1px solid rgba(100,130,170,0.12)', flexShrink: 0,
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#7dd3fc', letterSpacing: '0.05em', fontFamily: 'SF Pro Display, Inter, sans-serif' }}>
          GUIDED MODE
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', marginTop: 2, fontFamily: 'SF Pro Display, Inter, sans-serif' }}>
          {template.name}
        </div>
        <StepIndicator
          total={template.steps.length}
          current={currentStepIndex}
          completed={completedSteps}
        />
        <div style={{ fontSize: 9, color: 'rgba(148,163,184,0.5)', fontFamily: 'SF Pro Display, Inter, sans-serif' }}>
          Step {currentStepIndex + 1} of {template.steps.length}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px' }}>
        {allDone ? (
          <div style={{
            textAlign: 'center', padding: '20px 0',
          }}>
            <div style={{ marginBottom: 8 }}>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="14" stroke="#34d399" strokeWidth="2" />
                <path d="M 9 16 L 14 21 L 23 12" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#34d399', fontFamily: 'SF Pro Display, Inter, sans-serif' }}>
              Experiment Complete
            </div>
            <div style={{ fontSize: 10, color: 'rgba(148,163,184,0.7)', marginTop: 6, lineHeight: 1.5, fontFamily: 'SF Pro Display, Inter, sans-serif' }}>
              All steps completed. Review results in the notebook.
            </div>
            <button
              onClick={abandonExperiment}
              style={{
                marginTop: 14, padding: '7px 16px', borderRadius: 5, border: 'none',
                background: 'rgba(125,211,252,0.18)', color: '#7dd3fc',
                fontSize: 10, cursor: 'pointer', fontWeight: 600,
                fontFamily: 'SF Pro Display, Inter, sans-serif',
              }}
            >
              Return to Sandbox
            </button>
          </div>
        ) : step ? (
          <>
            {/* Step instruction */}
            <div style={{
              borderRadius: 7, border: '1px solid rgba(125,211,252,0.2)',
              background: 'rgba(15,35,65,0.6)', padding: '10px 12px', marginBottom: 10,
            }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#7dd3fc', letterSpacing: '0.06em', marginBottom: 5, fontFamily: 'SF Pro Display, Inter, sans-serif' }}>
                STEP {step.stepNumber} INSTRUCTION
              </div>
              <div style={{ fontSize: 11, color: '#e2e8f0', lineHeight: 1.55, fontFamily: 'SF Pro Display, Inter, sans-serif' }}>
                {step.instruction}
              </div>
            </div>

            {/* Hint */}
            {step.hint && (
              <div style={{ marginBottom: 10 }}>
                <button
                  onClick={() => setShowHint((h) => !h)}
                  style={{
                    width: '100%', padding: '5px 10px', borderRadius: 5, border: 'none',
                    background: showHint ? 'rgba(245,158,11,0.15)' : 'rgba(30,50,80,0.5)',
                    color: showHint ? '#fcd34d' : '#64748b',
                    fontSize: 10, cursor: 'pointer', textAlign: 'left',
                    fontFamily: 'SF Pro Display, Inter, sans-serif', fontWeight: 600,
                    transition: 'all 0.15s',
                  }}
                >
                  {showHint ? '▼ Hide Hint' : '▶ Show Hint'}
                </button>
                {showHint && (
                  <div style={{
                    padding: '7px 10px', borderRadius: '0 0 5px 5px',
                    background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
                    borderTop: 'none', fontSize: 10, color: '#fcd34d', lineHeight: 1.5,
                    fontFamily: 'SF Pro Display, Inter, sans-serif',
                  }}>
                    {step.hint}
                  </div>
                )}
              </div>
            )}

            {/* Completion */}
            {completedSteps.includes(step.id) && step.completionMessage && (
              <div style={{
                padding: '7px 10px', borderRadius: 5,
                background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)',
                fontSize: 10, color: '#34d399', lineHeight: 1.5, marginBottom: 10,
                fontFamily: 'SF Pro Display, Inter, sans-serif',
              }}>
                {step.completionMessage}
              </div>
            )}

            {/* Mark complete / advance */}
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => completeStep(step.id)}
                disabled={completedSteps.includes(step.id)}
                style={{
                  flex: 1, padding: '7px 0', borderRadius: 5, border: 'none',
                  background: completedSteps.includes(step.id) ? 'rgba(30,50,80,0.4)' : 'rgba(125,211,252,0.18)',
                  color: completedSteps.includes(step.id) ? '#374151' : '#7dd3fc',
                  fontSize: 10, cursor: completedSteps.includes(step.id) ? 'not-allowed' : 'pointer',
                  fontWeight: 600, fontFamily: 'SF Pro Display, Inter, sans-serif',
                  transition: 'all 0.15s',
                }}
              >
                {completedSteps.includes(step.id) ? '✓ Completed' : 'Mark Step Done'}
              </button>
            </div>

            {/* Safety notes */}
            {template.safetyNotes.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(245,158,11,0.7)', letterSpacing: '0.06em', marginBottom: 5, fontFamily: 'SF Pro Display, Inter, sans-serif' }}>
                  SAFETY NOTES
                </div>
                {template.safetyNotes.map((note, i) => (
                  <div key={i} style={{
                    fontSize: 9, color: 'rgba(148,163,184,0.7)', lineHeight: 1.5,
                    padding: '3px 0', fontFamily: 'SF Pro Display, Inter, sans-serif',
                    display: 'flex', gap: 5,
                  }}>
                    <span style={{ color: '#f59e0b', flexShrink: 0 }}>•</span>
                    {note}
                  </div>
                ))}
              </div>
            )}
          </>
        ) : null}
      </div>

      {/* Footer */}
      <div style={{
        padding: '8px 12px',
        borderTop: '1px solid rgba(100,130,170,0.1)',
        flexShrink: 0,
      }}>
        <button
          onClick={abandonExperiment}
          style={{
            width: '100%', padding: '5px 0', borderRadius: 5, border: 'none',
            background: 'rgba(30,50,80,0.5)', color: '#64748b',
            fontSize: 9, cursor: 'pointer', fontFamily: 'SF Pro Display, Inter, sans-serif',
          }}
        >
          Abandon Experiment
        </button>
      </div>
    </div>
  );
}
