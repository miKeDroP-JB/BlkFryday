#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════════════════════════╗
║  VYRA: GENESIS SECTOR - SWARM CONTROL PANEL                         ║
║  Visual Agent Orchestration Interface                                ║
╚══════════════════════════════════════════════════════════════════════╝
"""

import sys
import asyncio
import json
from datetime import datetime
from typing import Dict, List, Optional
from dataclasses import dataclass
import aiohttp

# PyQt6 for the GUI
from PyQt6.QtWidgets import (
    QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
    QLabel, QPushButton, QFrame, QScrollArea, QLineEdit, QTextEdit,
    QComboBox, QSlider, QProgressBar, QTabWidget, QSplitter,
    QGraphicsView, QGraphicsScene, QGraphicsEllipseItem, QGraphicsLineItem,
    QGraphicsTextItem, QStatusBar, QToolBar, QMenuBar, QMenu
)
from PyQt6.QtCore import Qt, QTimer, QThread, pyqtSignal, QPointF, QRectF
from PyQt6.QtGui import (
    QColor, QPen, QBrush, QFont, QPainter, QLinearGradient,
    QAction, QIcon, QPalette
)

# === CONFIGURATION ===

ORCHESTRATOR_URL = "http://localhost:9999"

# VYRA Neon Colors
COLORS = {
    "bg_dark": "#1a1b26",
    "bg_medium": "#24283b",
    "bg_light": "#414868",
    "purple": "#bb9af7",
    "pink": "#f7768e",
    "cyan": "#7dcfff",
    "green": "#9ece6a",
    "yellow": "#e0af68",
    "blue": "#7aa2f7",
    "text": "#c0caf5",
    "text_dim": "#565f89"
}

# === DATA MODELS ===

@dataclass
class Agent:
    id: str
    type: str
    model: str
    status: str
    created_at: str
    last_heartbeat: str
    x: float = 0
    y: float = 0

# === ASYNC WORKER ===

class OrchestratorWorker(QThread):
    """Background worker for API calls"""
    agents_updated = pyqtSignal(list)
    error_occurred = pyqtSignal(str)

    def __init__(self):
        super().__init__()
        self.running = True

    def run(self):
        """Poll orchestrator for updates"""
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        while self.running:
            try:
                agents = loop.run_until_complete(self.fetch_agents())
                self.agents_updated.emit(agents)
            except Exception as e:
                self.error_occurred.emit(str(e))

            loop.run_until_complete(asyncio.sleep(2))

        loop.close()

    async def fetch_agents(self) -> List[dict]:
        """Fetch agents from orchestrator"""
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{ORCHESTRATOR_URL}/agents") as resp:
                if resp.status == 200:
                    data = await resp.json()
                    return data.get("agents", [])
        return []

    def stop(self):
        self.running = False

# === AGENT NODE WIDGET ===

class AgentNode(QGraphicsEllipseItem):
    """Visual representation of an agent in the graph"""

    def __init__(self, agent: Agent, x: float, y: float):
        super().__init__(-30, -30, 60, 60)
        self.agent = agent
        self.setPos(x, y)

        # Style based on status
        if agent.status == "ready":
            color = QColor(COLORS["green"])
        elif agent.status == "busy":
            color = QColor(COLORS["yellow"])
        else:
            color = QColor(COLORS["purple"])

        self.setBrush(QBrush(color))
        self.setPen(QPen(QColor(COLORS["text"]), 2))

        # Add label
        self.label = QGraphicsTextItem(agent.id[-8:], self)
        self.label.setDefaultTextColor(QColor(COLORS["text"]))
        self.label.setFont(QFont("JetBrains Mono", 8))
        self.label.setPos(-25, -10)

        # Enable interaction
        self.setFlag(QGraphicsEllipseItem.GraphicsItemFlag.ItemIsMovable)
        self.setFlag(QGraphicsEllipseItem.GraphicsItemFlag.ItemIsSelectable)

    def update_status(self, status: str):
        """Update visual based on status"""
        if status == "ready":
            self.setBrush(QBrush(QColor(COLORS["green"])))
        elif status == "busy":
            self.setBrush(QBrush(QColor(COLORS["yellow"])))
        else:
            self.setBrush(QBrush(QColor(COLORS["purple"])))

# === SWARM GRAPH VIEW ===

class SwarmGraphView(QGraphicsView):
    """Interactive graph visualization of the swarm"""

    def __init__(self):
        super().__init__()
        self.scene = QGraphicsScene()
        self.setScene(self.scene)

        # Style
        self.setRenderHint(QPainter.RenderHint.Antialiasing)
        self.setBackgroundBrush(QBrush(QColor(COLORS["bg_dark"])))
        self.setFrameStyle(QFrame.Shape.NoFrame)

        # Nodes and connections
        self.nodes: Dict[str, AgentNode] = {}
        self.connections: List[QGraphicsLineItem] = []

        # Central orchestrator node
        self.add_orchestrator_node()

    def add_orchestrator_node(self):
        """Add central orchestrator node"""
        orch = QGraphicsEllipseItem(-40, -40, 80, 80)
        orch.setBrush(QBrush(QColor(COLORS["purple"])))
        orch.setPen(QPen(QColor(COLORS["pink"]), 3))
        orch.setPos(0, 0)

        label = QGraphicsTextItem("VYRA", orch)
        label.setDefaultTextColor(QColor(COLORS["text"]))
        label.setFont(QFont("JetBrains Mono", 12, QFont.Weight.Bold))
        label.setPos(-20, -10)

        self.scene.addItem(orch)
        self.orchestrator = orch

    def update_agents(self, agents: List[dict]):
        """Update agent nodes"""
        current_ids = set(self.nodes.keys())
        new_ids = set(a["id"] for a in agents)

        # Remove deleted agents
        for agent_id in current_ids - new_ids:
            node = self.nodes.pop(agent_id)
            self.scene.removeItem(node)

        # Add new agents
        import math
        for i, agent_data in enumerate(agents):
            agent_id = agent_data["id"]

            if agent_id not in self.nodes:
                # Calculate position in circle around orchestrator
                angle = (2 * math.pi * i) / max(len(agents), 1)
                radius = 150 + (i % 3) * 50
                x = math.cos(angle) * radius
                y = math.sin(angle) * radius

                agent = Agent(
                    id=agent_data["id"],
                    type=agent_data.get("type", "general"),
                    model=agent_data.get("model", "unknown"),
                    status=agent_data.get("status", "unknown"),
                    created_at=agent_data.get("created_at", ""),
                    last_heartbeat=agent_data.get("last_heartbeat", "")
                )

                node = AgentNode(agent, x, y)
                self.scene.addItem(node)
                self.nodes[agent_id] = node

                # Add connection to orchestrator
                line = QGraphicsLineItem(0, 0, x, y)
                line.setPen(QPen(QColor(COLORS["bg_light"]), 1, Qt.PenStyle.DashLine))
                self.scene.addItem(line)
                self.connections.append(line)

            else:
                # Update existing node
                self.nodes[agent_id].update_status(agent_data.get("status", "unknown"))

# === CONTROL PANEL WIDGET ===

class ControlPanel(QWidget):
    """Side panel for swarm controls"""

    spawn_requested = pyqtSignal(str, str)
    terminate_requested = pyqtSignal(str)
    inject_requested = pyqtSignal(str, str)
    scale_requested = pyqtSignal(int)

    def __init__(self):
        super().__init__()
        self.setup_ui()

    def setup_ui(self):
        layout = QVBoxLayout(self)
        layout.setSpacing(16)

        # Title
        title = QLabel("⟡ SWARM CONTROL")
        title.setFont(QFont("JetBrains Mono", 14, QFont.Weight.Bold))
        title.setStyleSheet(f"color: {COLORS['purple']};")
        layout.addWidget(title)

        # Spawn section
        spawn_frame = self.create_section("SPAWN AGENT")
        spawn_layout = QVBoxLayout(spawn_frame)

        self.agent_type = QComboBox()
        self.agent_type.addItems(["general", "coder", "researcher", "writer", "analyst"])
        self.agent_type.setStyleSheet(self.combo_style())
        spawn_layout.addWidget(QLabel("Type:"))
        spawn_layout.addWidget(self.agent_type)

        self.model_select = QComboBox()
        self.model_select.addItems(["llama3.1:8b", "codellama:7b", "mistral:7b", "phi3:mini"])
        self.model_select.setStyleSheet(self.combo_style())
        spawn_layout.addWidget(QLabel("Model:"))
        spawn_layout.addWidget(self.model_select)

        spawn_btn = QPushButton("⟡ SUMMON AGENT")
        spawn_btn.setStyleSheet(self.button_style(COLORS["purple"]))
        spawn_btn.clicked.connect(self.on_spawn)
        spawn_layout.addWidget(spawn_btn)

        layout.addWidget(spawn_frame)

        # Scale section
        scale_frame = self.create_section("SCALE SWARM")
        scale_layout = QVBoxLayout(scale_frame)

        self.scale_slider = QSlider(Qt.Orientation.Horizontal)
        self.scale_slider.setMinimum(0)
        self.scale_slider.setMaximum(16)
        self.scale_slider.setValue(3)
        self.scale_slider.setStyleSheet(self.slider_style())
        scale_layout.addWidget(self.scale_slider)

        self.scale_label = QLabel("Agents: 3")
        self.scale_label.setStyleSheet(f"color: {COLORS['text']};")
        self.scale_slider.valueChanged.connect(
            lambda v: self.scale_label.setText(f"Agents: {v}")
        )
        scale_layout.addWidget(self.scale_label)

        scale_btn = QPushButton("SCALE")
        scale_btn.setStyleSheet(self.button_style(COLORS["blue"]))
        scale_btn.clicked.connect(lambda: self.scale_requested.emit(self.scale_slider.value()))
        scale_layout.addWidget(scale_btn)

        layout.addWidget(scale_frame)

        # Inject section
        inject_frame = self.create_section("INJECT INSTRUCTION")
        inject_layout = QVBoxLayout(inject_frame)

        self.inject_target = QLineEdit()
        self.inject_target.setPlaceholderText("Agent ID...")
        self.inject_target.setStyleSheet(self.input_style())
        inject_layout.addWidget(self.inject_target)

        self.inject_text = QTextEdit()
        self.inject_text.setPlaceholderText("Instruction...")
        self.inject_text.setMaximumHeight(100)
        self.inject_text.setStyleSheet(self.input_style())
        inject_layout.addWidget(self.inject_text)

        inject_btn = QPushButton("INJECT")
        inject_btn.setStyleSheet(self.button_style(COLORS["cyan"]))
        inject_btn.clicked.connect(self.on_inject)
        inject_layout.addWidget(inject_btn)

        layout.addWidget(inject_frame)

        # Terminate section
        terminate_frame = self.create_section("TERMINATE")
        terminate_layout = QVBoxLayout(terminate_frame)

        terminate_all_btn = QPushButton("TERMINATE ALL")
        terminate_all_btn.setStyleSheet(self.button_style(COLORS["pink"]))
        terminate_all_btn.clicked.connect(lambda: self.terminate_requested.emit("all"))
        terminate_layout.addWidget(terminate_all_btn)

        layout.addWidget(terminate_frame)

        layout.addStretch()

    def create_section(self, title: str) -> QFrame:
        """Create a styled section frame"""
        frame = QFrame()
        frame.setStyleSheet(f"""
            QFrame {{
                background-color: {COLORS['bg_medium']};
                border: 1px solid {COLORS['bg_light']};
                border-radius: 8px;
                padding: 12px;
            }}
        """)

        label = QLabel(title)
        label.setFont(QFont("JetBrains Mono", 10, QFont.Weight.Bold))
        label.setStyleSheet(f"color: {COLORS['text_dim']}; border: none;")

        layout = QVBoxLayout(frame)
        layout.addWidget(label)

        return frame

    def button_style(self, color: str) -> str:
        return f"""
            QPushButton {{
                background-color: {color};
                color: {COLORS['bg_dark']};
                border: none;
                border-radius: 6px;
                padding: 10px 20px;
                font-family: 'JetBrains Mono';
                font-weight: bold;
            }}
            QPushButton:hover {{
                background-color: {COLORS['text']};
            }}
            QPushButton:pressed {{
                background-color: {COLORS['bg_light']};
                color: {COLORS['text']};
            }}
        """

    def combo_style(self) -> str:
        return f"""
            QComboBox {{
                background-color: {COLORS['bg_dark']};
                color: {COLORS['text']};
                border: 1px solid {COLORS['bg_light']};
                border-radius: 4px;
                padding: 8px;
            }}
        """

    def input_style(self) -> str:
        return f"""
            QLineEdit, QTextEdit {{
                background-color: {COLORS['bg_dark']};
                color: {COLORS['text']};
                border: 1px solid {COLORS['bg_light']};
                border-radius: 4px;
                padding: 8px;
            }}
        """

    def slider_style(self) -> str:
        return f"""
            QSlider::groove:horizontal {{
                background: {COLORS['bg_light']};
                height: 8px;
                border-radius: 4px;
            }}
            QSlider::handle:horizontal {{
                background: {COLORS['purple']};
                width: 18px;
                margin: -5px 0;
                border-radius: 9px;
            }}
        """

    def on_spawn(self):
        self.spawn_requested.emit(
            self.agent_type.currentText(),
            self.model_select.currentText()
        )

    def on_inject(self):
        target = self.inject_target.text()
        instruction = self.inject_text.toPlainText()
        if target and instruction:
            self.inject_requested.emit(target, instruction)

# === LOG PANEL ===

class LogPanel(QWidget):
    """Activity log panel"""

    def __init__(self):
        super().__init__()
        self.setup_ui()

    def setup_ui(self):
        layout = QVBoxLayout(self)

        title = QLabel("⟡ ACTIVITY LOG")
        title.setFont(QFont("JetBrains Mono", 12, QFont.Weight.Bold))
        title.setStyleSheet(f"color: {COLORS['purple']};")
        layout.addWidget(title)

        self.log_text = QTextEdit()
        self.log_text.setReadOnly(True)
        self.log_text.setStyleSheet(f"""
            QTextEdit {{
                background-color: {COLORS['bg_dark']};
                color: {COLORS['text']};
                border: 1px solid {COLORS['bg_light']};
                border-radius: 8px;
                font-family: 'JetBrains Mono';
                font-size: 11px;
            }}
        """)
        layout.addWidget(self.log_text)

    def add_log(self, message: str, level: str = "info"):
        """Add log entry"""
        timestamp = datetime.now().strftime("%H:%M:%S")

        if level == "error":
            color = COLORS["pink"]
        elif level == "warn":
            color = COLORS["yellow"]
        elif level == "success":
            color = COLORS["green"]
        else:
            color = COLORS["text_dim"]

        self.log_text.append(
            f'<span style="color: {color}">[{timestamp}]</span> '
            f'<span style="color: {COLORS["text"]}">{message}</span>'
        )

# === MAIN WINDOW ===

class SwarmPanel(QMainWindow):
    """Main application window"""

    def __init__(self):
        super().__init__()
        self.setWindowTitle("VYRA: Genesis Sector - Swarm Control Panel")
        self.setMinimumSize(1200, 800)
        self.setup_ui()
        self.setup_worker()
        self.apply_theme()

    def setup_ui(self):
        # Central widget
        central = QWidget()
        self.setCentralWidget(central)
        main_layout = QHBoxLayout(central)

        # Left: Control panel
        self.control_panel = ControlPanel()
        self.control_panel.setFixedWidth(300)
        self.control_panel.spawn_requested.connect(self.spawn_agent)
        self.control_panel.terminate_requested.connect(self.terminate_agent)
        self.control_panel.inject_requested.connect(self.inject_instruction)
        self.control_panel.scale_requested.connect(self.scale_swarm)
        main_layout.addWidget(self.control_panel)

        # Center: Graph view and log
        center_widget = QWidget()
        center_layout = QVBoxLayout(center_widget)

        # Graph view
        self.graph_view = SwarmGraphView()
        center_layout.addWidget(self.graph_view, stretch=3)

        # Log panel
        self.log_panel = LogPanel()
        center_layout.addWidget(self.log_panel, stretch=1)

        main_layout.addWidget(center_widget, stretch=1)

        # Status bar
        self.statusBar().showMessage("⟡ VYRA Swarm Panel Ready")
        self.statusBar().setStyleSheet(f"""
            QStatusBar {{
                background-color: {COLORS['bg_medium']};
                color: {COLORS['text']};
            }}
        """)

        # Menu bar
        self.setup_menu()

    def setup_menu(self):
        menubar = self.menuBar()
        menubar.setStyleSheet(f"""
            QMenuBar {{
                background-color: {COLORS['bg_medium']};
                color: {COLORS['text']};
            }}
            QMenuBar::item:selected {{
                background-color: {COLORS['purple']};
            }}
        """)

        # File menu
        file_menu = menubar.addMenu("File")
        exit_action = QAction("Exit", self)
        exit_action.triggered.connect(self.close)
        file_menu.addAction(exit_action)

        # Swarm menu
        swarm_menu = menubar.addMenu("Swarm")
        spawn_action = QAction("Spawn Agent", self)
        spawn_action.triggered.connect(lambda: self.spawn_agent("general", "llama3.1:8b"))
        swarm_menu.addAction(spawn_action)

        terminate_action = QAction("Terminate All", self)
        terminate_action.triggered.connect(lambda: self.terminate_agent("all"))
        swarm_menu.addAction(terminate_action)

        # View menu
        view_menu = menubar.addMenu("View")
        focus_action = QAction("Focus Trance Mode", self)
        view_menu.addAction(focus_action)

        clarity_action = QAction("Clarity Pulse Mode", self)
        view_menu.addAction(clarity_action)

    def setup_worker(self):
        """Start background worker"""
        self.worker = OrchestratorWorker()
        self.worker.agents_updated.connect(self.on_agents_updated)
        self.worker.error_occurred.connect(self.on_error)
        self.worker.start()

    def apply_theme(self):
        """Apply VYRA neon theme"""
        self.setStyleSheet(f"""
            QMainWindow {{
                background-color: {COLORS['bg_dark']};
            }}
            QWidget {{
                background-color: {COLORS['bg_dark']};
                color: {COLORS['text']};
                font-family: 'JetBrains Mono';
            }}
            QLabel {{
                color: {COLORS['text']};
            }}
        """)

    def on_agents_updated(self, agents: List[dict]):
        """Handle agent updates from worker"""
        self.graph_view.update_agents(agents)
        self.statusBar().showMessage(f"⟡ Active Agents: {len(agents)}")

    def on_error(self, error: str):
        """Handle errors from worker"""
        self.log_panel.add_log(f"Error: {error}", "error")

    async def _spawn_agent(self, agent_type: str, model: str):
        """Async spawn agent"""
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{ORCHESTRATOR_URL}/agents",
                json={"type": agent_type, "model": model}
            ) as resp:
                if resp.status == 201:
                    data = await resp.json()
                    self.log_panel.add_log(f"Spawned agent: {data['id']}", "success")
                else:
                    self.log_panel.add_log("Failed to spawn agent", "error")

    def spawn_agent(self, agent_type: str, model: str):
        """Spawn a new agent"""
        self.log_panel.add_log(f"Spawning {agent_type} agent with {model}...")
        asyncio.get_event_loop().run_until_complete(
            self._spawn_agent(agent_type, model)
        )

    async def _terminate_agent(self, agent_id: str):
        """Async terminate agent"""
        async with aiohttp.ClientSession() as session:
            if agent_id == "all":
                url = f"{ORCHESTRATOR_URL}/agents/all"
            else:
                url = f"{ORCHESTRATOR_URL}/agents/{agent_id}"

            async with session.delete(url) as resp:
                if resp.status == 200:
                    self.log_panel.add_log(f"Terminated: {agent_id}", "warn")
                else:
                    self.log_panel.add_log("Failed to terminate", "error")

    def terminate_agent(self, agent_id: str):
        """Terminate an agent"""
        self.log_panel.add_log(f"Terminating: {agent_id}...")
        asyncio.get_event_loop().run_until_complete(
            self._terminate_agent(agent_id)
        )

    async def _inject_instruction(self, agent_id: str, instruction: str):
        """Async inject instruction"""
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{ORCHESTRATOR_URL}/agents/{agent_id}/inject",
                json={"instruction": instruction}
            ) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    self.log_panel.add_log(f"Injected into {agent_id}", "success")
                else:
                    self.log_panel.add_log("Injection failed", "error")

    def inject_instruction(self, agent_id: str, instruction: str):
        """Inject instruction into agent"""
        self.log_panel.add_log(f"Injecting into {agent_id}...")
        asyncio.get_event_loop().run_until_complete(
            self._inject_instruction(agent_id, instruction)
        )

    async def _scale_swarm(self, count: int):
        """Async scale swarm"""
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{ORCHESTRATOR_URL}/scale",
                json={"count": count}
            ) as resp:
                if resp.status == 200:
                    self.log_panel.add_log(f"Scaled to {count} agents", "success")
                else:
                    self.log_panel.add_log("Scale failed", "error")

    def scale_swarm(self, count: int):
        """Scale swarm to count"""
        self.log_panel.add_log(f"Scaling to {count} agents...")
        asyncio.get_event_loop().run_until_complete(
            self._scale_swarm(count)
        )

    def closeEvent(self, event):
        """Handle window close"""
        self.worker.stop()
        self.worker.wait()
        event.accept()

# === ENTRY POINT ===

def main():
    app = QApplication(sys.argv)
    app.setStyle("Fusion")

    # Set dark palette
    palette = QPalette()
    palette.setColor(QPalette.ColorRole.Window, QColor(COLORS["bg_dark"]))
    palette.setColor(QPalette.ColorRole.WindowText, QColor(COLORS["text"]))
    palette.setColor(QPalette.ColorRole.Base, QColor(COLORS["bg_medium"]))
    palette.setColor(QPalette.ColorRole.AlternateBase, QColor(COLORS["bg_light"]))
    palette.setColor(QPalette.ColorRole.Text, QColor(COLORS["text"]))
    palette.setColor(QPalette.ColorRole.Button, QColor(COLORS["bg_medium"]))
    palette.setColor(QPalette.ColorRole.ButtonText, QColor(COLORS["text"]))
    palette.setColor(QPalette.ColorRole.Highlight, QColor(COLORS["purple"]))
    palette.setColor(QPalette.ColorRole.HighlightedText, QColor(COLORS["bg_dark"]))
    app.setPalette(palette)

    window = SwarmPanel()
    window.show()

    sys.exit(app.exec())

if __name__ == "__main__":
    main()
