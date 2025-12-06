const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

class AttendanceService {
  constructor() {
    this.baseURL = `${API_BASE_URL}/api`;
  }

  async getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  async getClassSubjects() {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}/teachers/attendance/class-subjects`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching class subjects:', error);
      throw error;
    }
  }

  async getStudentsForClassSubject(classSubjectId) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}/teachers/attendance/class-subjects/${classSubjectId}/students`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching students:', error);
      throw error;
    }
  }

  async markAttendance(attendanceData) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}/teachers/attendance/mark`, {
        method: 'POST',
        headers,
        body: JSON.stringify(attendanceData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error marking attendance:', error);
      throw error;
    }
  }

  async getAttendanceForDate(classSubjectId, attendanceDate) {
    try {
      const headers = await this.getAuthHeaders();
      // Ensure date is in YYYY-MM-DD format
      const formattedDate = new Date(attendanceDate).toISOString().split('T')[0];
      const response = await fetch(`${this.baseURL}/teachers/attendance/class-subjects/${classSubjectId}/date/${formattedDate}`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        console.error(`HTTP error! status: ${response.status}, date: ${formattedDate}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`Fetched ${data.length} attendance records for date ${formattedDate} (original: ${attendanceDate})`);
      return data;
    } catch (error) {
      console.error('Error fetching attendance:', error);
      throw error;
    }
  }

  async updateAttendanceRecord(attendanceId, updateData) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}/teachers/attendance/${attendanceId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating attendance:', error);
      throw error;
    }
  }

  async getAttendanceSummary(classSubjectId, startDate, endDate) {
    try {
      const headers = await this.getAuthHeaders();
      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate
      });

      const response = await fetch(`${this.baseURL}/teachers/attendance/summary/class-subjects/${classSubjectId}?${params}`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching attendance summary:', error);
      throw error;
    }
  }
}

export default new AttendanceService();
