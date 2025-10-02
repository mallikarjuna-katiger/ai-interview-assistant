import React, { useState, useEffect } from "react";
import {
  Tabs,
  Upload,
  Button,
  Table,
  Modal,
  Input,
  Typography,
  Card,
  Space,
  message,
  Select,
  Form,
} from "antd";
import { UploadOutlined, PlusOutlined } from "@ant-design/icons";

interface Answer {
  q: string;
  ans: string;
}

interface Candidate {
  name: string;
  answers: Answer[];
  score: number | null;
  summary: string;
}

interface Question {
  level: string;
  text: string;
  time: number;
}

const { Title, Text } = Typography;

/* ----------------- Default Question Bank ----------------- */
const defaultBank = {
  easy: [
    { level: "Easy", text: "What are the features of Java?", time: 20 },
    { level: "Easy", text: "What is JVM, JRE, and JDK?", time: 20 },
    { level: "Easy", text: "What is the difference between == and .equals()?", time: 20 },
  ],
  medium: [
    { level: "Medium", text: "Explain OOPs in Java with examples.", time: 60 },
    { level: "Medium", text: "What is Spring Boot and why is it used?", time: 60 },
    { level: "Medium", text: "How do you connect React frontend with Java backend?", time: 60 },
  ],
  hard: [
    { level: "Hard", text: "How does garbage collection work in Java?", time: 120 },
    { level: "Hard", text: "Explain microservices with Spring Boot.", time: 120 },
    { level: "Hard", text: "Explain JWT authentication in a full-stack project.", time: 120 },
  ],
};

/* ----------------- Random Question Generator ----------------- */
function pickRandom(arr: Question[], count: number) {
  return arr.sort(() => Math.random() - 0.5).slice(0, count);
}

function getRandomQuestions(bank: typeof defaultBank): Question[] {
  return [
    ...pickRandom(bank.easy, 2),
    ...pickRandom(bank.medium, 2),
    ...pickRandom(bank.hard, 2),
  ];
}

export default function App() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [currentCandidate, setCurrentCandidate] = useState<Candidate | null>(null);
  const [sampleQuestions, setSampleQuestions] = useState<Question[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [timer, setTimer] = useState(0);
  const [answer, setAnswer] = useState("");
  const [historyModal, setHistoryModal] = useState<Candidate | null>(null);
  const [welcomeBack, setWelcomeBack] = useState(false);

  // Question Bank in state
  const [questionBank, setQuestionBank] = useState(defaultBank);

  /* ----------------- Load saved data from localStorage ----------------- */
  useEffect(() => {
    const savedBank = localStorage.getItem("questionBank");
    if (savedBank) setQuestionBank(JSON.parse(savedBank));

    const savedCandidates = localStorage.getItem("candidates");
    if (savedCandidates) setCandidates(JSON.parse(savedCandidates));

    const savedSession = localStorage.getItem("currentSession");
    if (savedSession) {
      setWelcomeBack(true); // Show Welcome Back modal
    }
  }, []);

  /* ----------------- Save data to localStorage ----------------- */
  useEffect(() => {
    localStorage.setItem("questionBank", JSON.stringify(questionBank));
  }, [questionBank]);

  useEffect(() => {
    localStorage.setItem("candidates", JSON.stringify(candidates));
  }, [candidates]);

  useEffect(() => {
    if (currentCandidate) {
      localStorage.setItem(
        "currentSession",
        JSON.stringify({
          candidate: currentCandidate,
          questions: sampleQuestions,
          currentQ,
          timer,
          answer,
        })
      );
    } else {
      localStorage.removeItem("currentSession");
    }
  }, [currentCandidate, sampleQuestions, currentQ, timer, answer]);

  /* ----------------- Timer logic ----------------- */
  useEffect(() => {
    if (timer > 0) {
      const t = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(t);
    } else if (
      timer === 0 &&
      currentQ < sampleQuestions.length &&
      currentCandidate
    ) {
      saveAnswer();
    }
  }, [timer]);

  /* ----------------- Start Interview ----------------- */
  const startInterview = (name: string) => {
    if (!name.trim()) {
      message.error("Please enter candidate name!");
      return;
    }
    const questions = getRandomQuestions(questionBank);
    setSampleQuestions(questions);
    setCurrentCandidate({
      name,
      answers: [],
      score: null,
      summary: "",
    });
    setCurrentQ(0);
    setTimer(questions[0].time);
  };

  /* ----------------- Resume Interview ----------------- */
  const resumeInterview = () => {
    const savedSession = localStorage.getItem("currentSession");
    if (savedSession) {
      const session = JSON.parse(savedSession);
      setCurrentCandidate(session.candidate);
      setSampleQuestions(session.questions);
      setCurrentQ(session.currentQ);
      setTimer(session.timer);
      setAnswer(session.answer);
    }
    setWelcomeBack(false);
  };

  /* ----------------- Discard Session ----------------- */
  const discardSession = () => {
    localStorage.removeItem("currentSession");
    setWelcomeBack(false);
    message.info("Previous session discarded.");
  };

  /* ----------------- Save Answer ----------------- */
  const saveAnswer = () => {
    if (!currentCandidate) return;
    const updated: Candidate = { ...currentCandidate };
    updated.answers.push({
      q: sampleQuestions[currentQ].text,
      ans: answer || "No answer",
    });
    setAnswer("");
    if (currentQ + 1 < sampleQuestions.length) {
      setCurrentQ(currentQ + 1);
      setTimer(sampleQuestions[currentQ + 1].time);
      setCurrentCandidate(updated);
    } else {
      updated.score = Math.floor(Math.random() * 100);
      updated.summary = `Candidate ${updated.name} scored ${updated.score}%.`;
      setCandidates([...candidates, updated]);
      setCurrentCandidate(null);
      message.success("Interview completed successfully!");
    }
  };

  /* ----------------- Add Custom Question ----------------- */
  const onAddQuestion = (values: { level: string; text: string; time: number }) => {
    setQuestionBank({
      ...questionBank,
      [values.level.toLowerCase()]: [
        ...questionBank[values.level.toLowerCase() as keyof typeof defaultBank],
        { level: values.level, text: values.text, time: values.time },
      ],
    });
    message.success("New question added!");
  };

  /* ----------------- UI ----------------- */
  return (
    <div style={{ padding: 30, background: "#f5f7fa", minHeight: "100vh" }}>
      <Card style={{ borderRadius: 16, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
        <Title level={2} style={{ textAlign: "center", marginBottom: 20 }}>
          🎤 AI Interview Assistant
        </Title>

        <Tabs defaultActiveKey="1" centered>
          {/* Interviewee Tab */}
          <Tabs.TabPane tab="👩‍💻 Interviewee" key="1">
            {!currentCandidate ? (
              <Space direction="vertical" size="large" style={{ width: "100%" }}>
                <Upload beforeUpload={() => false as unknown as boolean}>
                  <Button type="dashed" icon={<UploadOutlined />}>
                    Upload Resume
                  </Button>
                </Upload>
                <Input.Search
                  placeholder="Enter Candidate Name"
                  enterButton="Start Interview"
                  onSearch={(value) => startInterview(value)}
                />
              </Space>
            ) : (
              <Card
                title={`Q${currentQ + 1} (${sampleQuestions[currentQ].level})`}
                bordered={false}
                style={{ borderRadius: 12, background: "#fff" }}
              >
                <Text strong>{sampleQuestions[currentQ].text}</Text>
                <p style={{ margin: "10px 0" }}>⏳ Time left: {timer}s</p>
                <Input.TextArea
                  rows={4}
                  placeholder="Type your answer here..."
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                />
                <Button
                  type="primary"
                  onClick={saveAnswer}
                  style={{ marginTop: 12 }}
                >
                  Submit Answer
                </Button>
              </Card>
            )}
          </Tabs.TabPane>

          {/* Interviewer Dashboard */}
          <Tabs.TabPane tab="🧑‍💼 Interviewer Dashboard" key="2">
            <Table
              dataSource={candidates}
              rowKey="name"
              bordered
              pagination={false}
              style={{ background: "#fff", borderRadius: 12, marginBottom: 20 }}
              columns={[
                { title: "Name", dataIndex: "name" },
                { title: "Score", dataIndex: "score" },
                { title: "Summary", dataIndex: "summary" },
                {
                  title: "Actions",
                  render: (_, rec) => (
                    <Button type="link" onClick={() => setHistoryModal(rec)}>
                      View Details
                    </Button>
                  ),
                },
              ]}
            />

            {/* Add Question Form */}
            <Card title="➕ Add Custom Question" style={{ borderRadius: 12 }}>
              <Form layout="inline" onFinish={onAddQuestion}>
                <Form.Item
                  name="level"
                  rules={[{ required: true, message: "Select level" }]}
                >
                  <Select placeholder="Level" style={{ width: 120 }}>
                    <Select.Option value="Easy">Easy</Select.Option>
                    <Select.Option value="Medium">Medium</Select.Option>
                    <Select.Option value="Hard">Hard</Select.Option>
                  </Select>
                </Form.Item>
                <Form.Item
                  name="text"
                  rules={[{ required: true, message: "Enter question text" }]}
                >
                  <Input placeholder="Question text" style={{ width: 300 }} />
                </Form.Item>
                <Form.Item
                  name="time"
                  rules={[{ required: true, message: "Enter time in seconds" }]}
                >
                  <Input type="number" placeholder="Time (sec)" style={{ width: 120 }} />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>
                    Add
                  </Button>
                </Form.Item>
              </Form>
            </Card>

            {/* History Modal */}
            <Modal
              title={`Interview History - ${historyModal?.name}`}
              open={!!historyModal}
              onCancel={() => setHistoryModal(null)}
              footer={null}
            >
              {historyModal &&
                historyModal.answers.map((a, i) => (
                  <Card key={i} style={{ marginBottom: 10, borderRadius: 10 }}>
                    <p>
                      <b>Q:</b> {a.q}
                    </p>
                    <p>
                      <b>A:</b> {a.ans}
                    </p>
                  </Card>
                ))}
            </Modal>
          </Tabs.TabPane>
        </Tabs>
      </Card>

      {/* Welcome Back Modal */}
      <Modal
        title="👋 Welcome Back!"
        open={welcomeBack}
        onCancel={discardSession}
        footer={[
          <Button key="discard" danger onClick={discardSession}>
            Start Fresh
          </Button>,
          <Button key="resume" type="primary" onClick={resumeInterview}>
            Resume Interview
          </Button>,
        ]}
      >
        <p>We found an unfinished interview session. Would you like to resume where you left off?</p>
      </Modal>
    </div>
  );
}
