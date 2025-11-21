import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView, 
  Platform,
  KeyboardAvoidingView 
} from 'react-native';

export default function App() {
  // State สำหรับเก็บสถานะหน้าปัจจุบัน และ ข้อความแชท
  const [currentPage, setCurrentPage] = useState('A'); 
  const [messages, setMessages] = useState([{ id: 1, text: 'สวัสดีครับ! พิมพ์ "ไปหน้า B" ลองดูสิ', sender: 'bot' }]);
  const [inputText, setInputText] = useState('');

  // --- ตั้งค่า URL ของ Server ตรงนี้ ---
  // *อย่าลืมเปลี่ยนเป็น URL ของ ngrok หรือ IP เครื่องคุณเอง*
  const SERVER_URL = 'https://582805198feb.ngrok-free.app/chat'; 

  // ฟังก์ชันส่งข้อความ (และรับคำสั่งเปลี่ยนหน้า)
  const sendMessage = async () => {
    if (inputText.trim().length > 0) {
      // 1. แสดงข้อความฝั่งเรา (User) ทันที
      const userMsgText = inputText;
      const newMsg = { id: Date.now(), text: userMsgText, sender: 'user' };
      setMessages(prev => [...prev, newMsg]);
      setInputText(''); // เคลียร์ช่องพิมพ์

      try {
        console.log("Sending to:", SERVER_URL);
        
        // 2. ยิง Request ไปหา Python
        const response = await fetch(SERVER_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: userMsgText }),
        });

        if (!response.ok) {
             throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();

        // 3. แสดงคำตอบจาก Bot (data.reply)
        const botMsg = { 
            id: Date.now() + 1, 
            text: data.reply, 
            sender: 'bot' 
        };
        setMessages(prev => [...prev, botMsg]);

        // ====================================================
        // ส่วนที่เพิ่มใหม่: เช็คคำสั่งเปลี่ยนหน้าจาก Server
        // ====================================================
        if (data.navigate_to) { 
            console.log("Server สั่งให้ไปหน้า:", data.navigate_to);
            
            // หน่วงเวลา 1.5 วินาที ให้ผู้ใช้อ่านข้อความก่อน แล้วค่อยวาร์ป
            setTimeout(() => {
                // เช็คความปลอดภัยนิดนึง ว่าหน้าที่จะไปมีอยู่จริงไหม (A, B, C, Chat)
                const validPages = ['A', 'B', 'C', 'Chat'];
                if (validPages.includes(data.navigate_to)) {
                    setCurrentPage(data.navigate_to);
                }
            }, 1500);
        }
        // ====================================================

      } catch (error) {
        console.error("Error details:", error);
        const errorMsg = { 
            id: Date.now() + 1, 
            text: "เกิดข้อผิดพลาด: เชื่อมต่อ Server ไม่ได้ (เช็ค URL/ngrok)", 
            sender: 'bot' 
        };
        setMessages(prev => [...prev, errorMsg]);
      }
    }
  };

  // ฟังก์ชันสำหรับเลือกแสดงหน้าจอ (Render)
  const renderPage = () => {
    if (currentPage === 'Chat') {
      return (
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.chatContainer}
        >
          <ScrollView 
            style={styles.messageList}
            ref={ref => {this.scrollView = ref}}
            onContentSizeChange={() => this.scrollView.scrollToEnd({animated: true})}
          >
            {messages.map((msg) => (
              <View key={msg.id} style={[styles.msgBubble, msg.sender === 'user' ? styles.userMsg : styles.botMsg]}>
                <Text style={styles.msgText}>{msg.text}</Text>
              </View>
            ))}
          </ScrollView>
          <View style={styles.inputArea}>
            <TextInput 
              style={styles.input} 
              value={inputText}
              onChangeText={setInputText}
              placeholder="พิมพ์ข้อความ..." 
            />
            <TouchableOpacity onPress={sendMessage} style={styles.sendBtn}>
              <Text style={styles.btnText}>ส่ง</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      );
    }
    
    // หน้า A, B, C
    return (
      <View style={styles.centerPage}>
        <Text style={styles.bigText}>{currentPage}</Text>
        {/* ปุ่มเล็กๆ เผื่ออยากกดกลับไปหน้าแชทจากหน้านี้ */}
        <TouchableOpacity onPress={() => setCurrentPage('Chat')} style={{marginTop: 20}}>
             <Text style={{color: '#0084ff'}}>กลับไปแชท</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* ส่วนเนื้อหาหลัก */}
      <View style={styles.content}>
        {renderPage()}
      </View>

      {/* เมนูบาร์ด้านล่าง */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => setCurrentPage('A')} style={styles.navBtn}>
          <Text style={[styles.navText, currentPage === 'A' && styles.activeText]}>หน้า A</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setCurrentPage('B')} style={styles.navBtn}>
          <Text style={[styles.navText, currentPage === 'B' && styles.activeText]}>หน้า B</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setCurrentPage('C')} style={styles.navBtn}>
          <Text style={[styles.navText, currentPage === 'C' && styles.activeText]}>หน้า C</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setCurrentPage('Chat')} style={styles.navBtn}>
          <Text style={[styles.navText, currentPage === 'Chat' && styles.activeText]}>แชท</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { flex: 1, paddingBottom: 10 },
  
  // หน้า A B C (ดันตัวหนังสือขึ้นสูง)
  centerPage: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 100 },
  bigText: { fontSize: 100, fontWeight: 'bold', color: '#333' },

  // หน้า Chat
  chatContainer: { flex: 1, padding: 10 },
  messageList: { flex: 1 },
  msgBubble: { padding: 12, borderRadius: 15, marginVertical: 5, maxWidth: '80%' },
  userMsg: { backgroundColor: '#0084ff', alignSelf: 'flex-end', borderBottomRightRadius: 2 },
  botMsg: { backgroundColor: '#e4e6eb', alignSelf: 'flex-start', borderBottomLeftRadius: 2 },
  msgText: { color: '#050505', fontSize: 16 },
  
  inputArea: { flexDirection: 'row', padding: 10, backgroundColor: 'white', borderRadius: 25, marginTop: 10, alignItems: 'center', shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  input: { flex: 1, paddingHorizontal: 15, height: 40, fontSize: 16 },
  sendBtn: { backgroundColor: '#0084ff', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginLeft: 5 },
  btnText: { color: 'white', fontWeight: 'bold' },

  // Menu Bar
  navBar: { flexDirection: 'row', height: 70, borderTopWidth: 1, borderTopColor: '#ddd', backgroundColor: 'white', alignItems: 'center', paddingBottom: 10 },
  navBtn: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navText: { fontSize: 14, color: '#888', marginTop: 4 },
  activeText: { color: '#0084ff', fontWeight: 'bold' }
});