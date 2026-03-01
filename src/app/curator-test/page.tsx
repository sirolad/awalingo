'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import {
  getCuratorTestQuestions,
  canUserTakeQuiz,
  submitQuizAttempt,
} from '@/actions/quiz';
import { formatDistanceToNow } from 'date-fns';

interface Question {
  id: number;
  text: string;
  options: { label: string; value: string }[];
  correctAnswer: string;
}

export default function CuratorTestPage() {
  const router = useRouter();
  const { appUser, isLoading: authLoading } = useAuth();

  // Checking Eligibility State
  const [isChecking, setIsChecking] = useState(true);
  const [eligibilityData, setEligibilityData] = useState<{
    canTake: boolean;
    reason?: string;
    eligibleAt?: Date;
  } | null>(null);

  // Quiz State
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Active Test State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(10 * 60); // 10 minutes

  useEffect(() => {
    async function initTest() {
      if (authLoading) return;
      if (!appUser) {
        router.push('/signin');
        return;
      }

      // Check Eligibility
      const eligibilityResult = await canUserTakeQuiz(appUser.id);
      setIsChecking(false);

      if (!eligibilityResult.success || !eligibilityResult.canTake) {
        setEligibilityData({
          canTake: false,
          reason:
            eligibilityResult.reason ||
            'You are not eligible to take this test at the moment.',
          eligibleAt: eligibilityResult.eligibleAt,
        });
        setIsLoadingQuestions(false);
        return;
      }

      setEligibilityData({ canTake: true });

      // Fetch Questions
      const questionsResult = await getCuratorTestQuestions(appUser.id);
      if (questionsResult.success && questionsResult.questions) {
        // Handle case where fewer questions are available than requested
        if (questionsResult.questions.length === 0) {
          setFetchError(
            'No questions are currently available for your target language. Please try again later.'
          );
        } else {
          setQuestions(questionsResult.questions);
        }
      } else {
        setFetchError(
          questionsResult.error ||
            'Failed to load questions. Please check your target language settings.'
        );
      }
      setIsLoadingQuestions(false);
    }

    initTest();
  }, [appUser, authLoading, router]);

  // Timer Countdown Effect
  useEffect(() => {
    if (
      isLoadingQuestions ||
      isChecking ||
      fetchError ||
      questions.length === 0 ||
      !eligibilityData?.canTake ||
      isSubmitting ||
      timeLeft === 0
    ) {
      return;
    }

    const timerObj = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerObj);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerObj);
  }, [
    isLoadingQuestions,
    isChecking,
    fetchError,
    questions.length,
    eligibilityData,
    isSubmitting,
    timeLeft,
  ]);

  if (authLoading || isChecking) {
    return (
      <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 flex flex-col justify-center items-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 bg-neutral-300 dark:bg-neutral-800 rounded-full mb-4"></div>
          <div className="h-4 w-32 bg-neutral-300 dark:bg-neutral-800 rounded"></div>
        </div>
      </div>
    );
  }

  // --- Ineligible View ---
  if (eligibilityData && !eligibilityData.canTake) {
    return (
      <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 flex flex-col items-center justify-center p-6">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-8 max-w-md w-full text-center border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h1 className="heading-5 text-neutral-900 dark:text-neutral-100 mb-2">
            Test Unavailable
          </h1>
          <p className="body-base text-neutral-600 dark:text-neutral-400 mb-6">
            {eligibilityData.reason}
            {eligibilityData.eligibleAt && (
              <span className="block mt-2 font-medium">
                You can try again in{' '}
                {formatDistanceToNow(eligibilityData.eligibleAt)}.
              </span>
            )}
          </p>
          <Button onClick={() => router.push('/home')} className="w-full">
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  // --- Loading / Error Fetching Questions ---
  if (isLoadingQuestions) {
    return (
      <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 flex flex-col">
        <header className="px-4 py-4 lg:px-8 lg:py-6">
          <div className="w-10 h-10 bg-neutral-200 dark:bg-neutral-800 rounded-full animate-pulse"></div>
        </header>
        <main className="flex-1 px-5 pb-8 lg:px-8 lg:pb-16 mt-8">
          <div className="max-w-md lg:max-w-lg mx-auto">
            <div className="bg-white dark:bg-neutral-900 rounded-[20px] p-6 lg:p-8 animate-pulse border border-neutral-200 dark:border-neutral-800 shadow-sm">
              <div className="h-8 bg-neutral-200 dark:bg-neutral-800 rounded w-2/3 mx-auto mb-2"></div>
              <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-1/2 mx-auto mb-10"></div>

              <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-full mb-8"></div>
              <div className="h-6 bg-neutral-200 dark:bg-neutral-800 rounded w-full mb-8 max-w-sm"></div>

              <div className="space-y-4">
                {[1, 2, 3, 4].map(i => (
                  <div
                    key={i}
                    className="h-16 bg-neutral-200 dark:bg-neutral-800 rounded-lg"
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (fetchError || questions.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 flex flex-col items-center justify-center p-6">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-8 max-w-md w-full text-center border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h1 className="heading-5 text-neutral-900 dark:text-neutral-100 mb-2">
            Unable to Load Test
          </h1>
          <p className="body-base text-neutral-600 dark:text-neutral-400 mb-6">
            {fetchError || 'An unexpected error occurred.'}
          </p>
          <Button onClick={() => router.push('/home')} className="w-full">
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  // --- Active Test Flow ---
  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setSelectedAnswer(answers[currentQuestionIndex - 1] || null);
    } else {
      router.back();
    }
  };

  const handleSelectAnswer = (value: string) => {
    setSelectedAnswer(value);
  };

  const submitTest = async (finalAnswers: string[]) => {
    if (!appUser) return;
    setIsSubmitting(true);

    const correctCount = finalAnswers.filter(
      (answer, index) => answer === questions[index].correctAnswer
    ).length;

    const submitResult = await submitQuizAttempt(
      appUser.id,
      correctCount,
      totalQuestions
    );

    if (submitResult.success) {
      router.push(
        `/curator-test/result?passed=${submitResult.passed}&score=${correctCount}`
      );
    } else {
      setIsSubmitting(false);
      alert('Failed to submit results. Please try again.');
    }
  };

  // Auto-submit effect when timer reaches 0
  useEffect(() => {
    if (timeLeft === 0 && !isSubmitting && questions.length > 0) {
      const finalAnswers = [...answers];
      if (selectedAnswer && currentQuestionIndex === finalAnswers.length) {
        finalAnswers[currentQuestionIndex] = selectedAnswer;
      }
      submitTest(finalAnswers);
    }
  }, [
    timeLeft,
    isSubmitting,
    questions.length,
    answers,
    selectedAnswer,
    currentQuestionIndex,
  ]);

  const handleNext = async () => {
    if (!selectedAnswer || !appUser) return;

    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = selectedAnswer;
    setAnswers(newAnswers);

    if (isLastQuestion) {
      await submitTest(newAnswers);
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(newAnswers[currentQuestionIndex + 1] || null);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 flex flex-col">
      {/* Header */}
      <header className="px-4 py-4 lg:px-8 lg:py-6 flex justify-between items-center">
        <button
          onClick={handleBack}
          disabled={isSubmitting}
          className="p-2 -ml-2 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-full transition-colors disabled:opacity-50"
          aria-label="Go back"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <div
          className={`flex items-center gap-2 font-mono text-lg font-semibold px-3 py-1.5 rounded-full border ${timeLeft < 60 ? 'text-rose-600 border-rose-200 bg-rose-50 dark:bg-rose-900/20 dark:border-rose-800' : 'text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900'}`}
        >
          <Clock className="w-5 h-5" />
          {Math.floor(timeLeft / 60)}:
          {(timeLeft % 60).toString().padStart(2, '0')}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-5 pb-8 lg:px-8 lg:pb-16 flex flex-col md:justify-center">
        <div className="max-w-md lg:max-w-lg mx-auto w-full">
          {/* Question Card */}
          <div className="bg-white dark:bg-neutral-900 rounded-[20px] border border-neutral-200 dark:border-neutral-800 p-6 lg:p-8">
            {/* Card Header */}
            <div className="text-center pb-4 border-b border-neutral-200 dark:border-neutral-800 mb-6">
              <h1 className="heading-3 text-neutral-950 dark:text-neutral-50 mb-2">
                Lang Cultural Check
              </h1>
              <p className="body-small text-neutral-600 dark:text-neutral-400">
                Provide your answers to these questions, to become a Neo
                Contributor
              </p>
            </div>

            {/* Progress */}
            <div className="flex items-center justify-between mb-6">
              <span className="body-base font-semibold text-neutral-600 dark:text-neutral-400">
                Question {currentQuestionIndex + 1} of {totalQuestions}
              </span>
              <div className="flex gap-1">
                {Array.from({ length: totalQuestions }).map((_, index) => (
                  <div
                    key={index}
                    className={`h-1.5 w-6 rounded-full transition-colors ${
                      index <= currentQuestionIndex
                        ? 'bg-neutral-950 dark:bg-neutral-50'
                        : 'bg-neutral-200 dark:bg-neutral-700'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Question */}
            <h2 className="heading-5 text-neutral-950 dark:text-neutral-50 mb-6 leading-relaxed">
              {currentQuestion.text}
            </h2>

            {/* Options */}
            <div className="space-y-4">
              {currentQuestion.options.map(option => (
                <button
                  key={option.label}
                  onClick={() => handleSelectAnswer(option.value)}
                  disabled={isSubmitting}
                  className={`w-full flex items-center p-4 rounded-xl border transition-all ${
                    selectedAnswer === option.value
                      ? 'border-primary bg-neutral-50 dark:bg-neutral-800 ring-1 ring-primary'
                      : 'border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                  }`}
                >
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mr-4 text-sm font-bold ${
                      selectedAnswer === option.value
                        ? 'bg-primary text-white'
                        : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    {option.label}
                  </span>
                  <span className="body-base font-medium text-neutral-800 dark:text-neutral-200 text-left w-full h-full flex items-center py-1">
                    {option.value}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer Button */}
      <div className="px-5 pb-8 lg:px-8 lg:pb-12 mt-auto">
        <div className="max-w-md lg:max-w-lg mx-auto">
          <Button
            onClick={handleNext}
            disabled={!selectedAnswer || isSubmitting}
            className={`w-full rounded-full h-14 lg:h-16 text-lg lg:text-xl font-semibold transition-colors ${
              selectedAnswer
                ? 'bg-neutral-950 dark:bg-neutral-50 hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-950'
                : 'bg-neutral-300 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-500 cursor-not-allowed'
            }`}
          >
            {isSubmitting
              ? 'Sumitting...'
              : isLastQuestion
                ? 'Submit Test'
                : 'Next Question'}
          </Button>
        </div>
      </div>
    </div>
  );
}
