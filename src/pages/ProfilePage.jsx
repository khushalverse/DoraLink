import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { 
  getUserProfile, 
  updateUserProfile 
} from '../services/supabase'
import { 
  ArrowLeft, 
  Camera, 
  Check,
  Edit2
} from 'lucide-react'

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const [profile, setProfile] = useState(null)
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const avatarColors = [
    '#00A8D6','#FF6B6B','#4ECDC4',
    '#A29BFE','#FD79A8','#00B894',
    '#E17055','#6C5CE7'
  ]
  const [selectedColor, setSelectedColor] = useState(
    '#00A8D6'
  )

  useEffect(() => {
    if(user) loadProfile()
  }, [user])

  const loadProfile = async () => {
    const data = await getUserProfile(user.id)
    if(data) {
      setProfile(data)
      setDisplayName(
        data.display_name || 
        user?.email?.split('@')[0] || ''
      )
      setBio(data.bio || '')
      setSelectedColor(
        data.avatar_color || '#00A8D6'
      )
    } else {
      setDisplayName(
        user?.email?.split('@')[0] || ''
      )
    }
  }

  const saveProfile = async () => {
    setSaving(true)
    try {
      await updateUserProfile(user.id, {
        display_name: displayName,
        bio: bio,
        avatar_color: selectedColor
      })
      setSaved(true)
      setEditing(false)
      setTimeout(() => setSaved(false), 2000)
      await loadProfile()
    } catch(err) {
      console.error(err)
    }
    setSaving(false)
  }

  const initials = displayName
    ? displayName.slice(0,2).toUpperCase()
    : '?'

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F0F9FF',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: "'Nunito', sans-serif"
    }}>
      <style>{`
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(20px) }
          to { opacity:1; transform:translateY(0) }
        }
        @keyframes popIn {
          from { opacity:0; transform:scale(0.8) }
          to { opacity:1; transform:scale(1) }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Background blobs */}
      <div style={{
        position:'absolute', top:'-80px', 
        right:'-80px', width:'220px', 
        height:'220px', borderRadius:'50%',
        background:'#00A8D6', opacity:0.1,
        zIndex:0
      }}/>
      <div style={{
        position:'absolute', bottom:'100px',
        left:'-100px', width:'250px',
        height:'250px', borderRadius:'50%',
        background:'#00A8D6', opacity:0.08,
        zIndex:0
      }}/>

      {/* Header */}
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        zIndex: 30,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        background: 'linear-gradient(to bottom, rgba(240,249,255,1) 0%, rgba(240,249,255,0) 100%)'
      }}>
        <button
          onClick={() => window.history.back()}
          style={{
            width:'42px', height:'42px',
            borderRadius:'50%',
            background:'#E0F4FB',
            border:'1.5px solid #B8E4F5',
            cursor:'pointer',
            display:'flex',
            alignItems:'center',
            justifyContent:'center'
          }}
        >
          <ArrowLeft size={20} color="#00A8D6"/>
        </button>

        <span style={{
          fontWeight:'800', fontSize:'18px',
          color:'#00A8D6'
        }}>My Profile</span>

        <button
          onClick={() => editing 
            ? saveProfile() 
            : setEditing(true)
          }
          style={{
            width:'42px', height:'42px',
            borderRadius:'50%',
            background: editing 
              ? '#00A8D6' : '#E0F4FB',
            border:'1.5px solid #B8E4F5',
            cursor:'pointer',
            display:'flex',
            alignItems:'center',
            justifyContent:'center'
          }}
        >
          {saving ? (
            <div style={{
              width:'16px', height:'16px',
              border:'2px solid white',
              borderTop:'2px solid transparent',
              borderRadius:'50%',
              animation:'spin 0.8s linear infinite'
            }}/>
          ) : editing ? (
            <Check size={20} color="white"/>
          ) : (
            <Edit2 size={18} color="#00A8D6"/>
          )}
        </button>
      </div>

      {/* Content */}
      <div style={{
        paddingTop: '80px',
        paddingBottom: '40px',
        position: 'relative',
        zIndex: 1
      }}>

        {/* Avatar Section */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '24px 16px',
          animation: 'fadeUp 0.4s ease'
        }}>
          {/* Avatar Circle */}
          <div style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: selectedColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '36px',
            fontWeight: '800',
            color: 'white',
            boxShadow: `0 8px 24px ${selectedColor}50`,
            marginBottom: '16px',
            animation: 'popIn 0.5s ease'
          }}>
            {initials}
          </div>

          {/* Color Picker */}
          {editing && (
            <div style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '16px',
              flexWrap: 'wrap',
              justifyContent: 'center',
              animation: 'fadeUp 0.3s ease'
            }}>
              {avatarColors.map(color => (
                <button
                  key={color}
                  onClick={() => 
                    setSelectedColor(color)
                  }
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: color,
                    border: selectedColor === color
                      ? '3px solid white'
                      : '3px solid transparent',
                    cursor: 'pointer',
                    boxShadow: selectedColor === color
                      ? `0 0 0 2px ${color}`
                      : 'none',
                    transition: 'all 0.2s'
                  }}
                />
              ))}
            </div>
          )}

          {/* Display Name */}
          {editing ? (
            <input
              value={displayName}
              onChange={e => 
                setDisplayName(e.target.value)
              }
              placeholder="Your name"
              style={{
                fontSize: '22px',
                fontWeight: '800',
                color: '#1a1a1a',
                textAlign: 'center',
                border: 'none',
                borderBottom: '2px solid #00A8D6',
                background: 'transparent',
                fontFamily: "'Nunito', sans-serif",
                outline: 'none',
                marginBottom: '8px',
                width: '200px'
              }}
            />
          ) : (
            <h2 style={{
              fontSize: '22px',
              fontWeight: '800',
              color: '#1a1a1a',
              marginBottom: '4px'
            }}>
              {displayName || 'Set your name'}
            </h2>
          )}

          <p style={{
            fontSize: '14px',
            color: '#9ca3af',
            marginBottom: '8px'
          }}>
            {user?.email}
          </p>
        </div>

        {/* Bio Section */}
        <div style={{
          margin: '0 16px 16px 16px',
          background: 'white',
          borderRadius: '20px',
          padding: '20px',
          boxShadow: '0 2px 12px rgba(0,168,214,0.08)',
          animation: 'fadeUp 0.5s ease'
        }}>
          <p style={{
            fontWeight: '700',
            fontSize: '14px',
            color: '#9ca3af',
            marginBottom: '10px',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>About Me</p>

          {editing ? (
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Tell DoraLink about yourself... your goals, interests, what you're working on! 😄"
              rows={3}
              style={{
                width: '100%',
                border: '1.5px solid #E0F4FB',
                borderRadius: '12px',
                padding: '12px',
                fontFamily: "'Nunito', sans-serif",
                fontSize: '14px',
                color: '#1a1a1a',
                outline: 'none',
                resize: 'none',
                boxSizing: 'border-box',
                background: '#F8FDFF'
              }}
            />
          ) : (
            <p style={{
              fontSize: '15px',
              color: bio ? '#1a1a1a' : '#9ca3af',
              lineHeight: '1.6',
              fontStyle: bio ? 'normal' : 'italic'
            }}>
              {bio || 'Add a bio — DoraLink will know you better! 😄'}
            </p>
          )}
        </div>

        {/* Stats Card */}
        <div style={{
          margin: '0 16px 16px 16px',
          background: 'white',
          borderRadius: '20px',
          padding: '20px',
          boxShadow: '0 2px 12px rgba(0,168,214,0.08)',
          animation: 'fadeUp 0.6s ease'
        }}>
          <p style={{
            fontWeight: '700',
            fontSize: '14px',
            color: '#9ca3af',
            marginBottom: '16px',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>Account Info</p>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{
                fontSize: '14px',
                color: '#9ca3af',
                fontWeight: '600'
              }}>Email</span>
              <span style={{
                fontSize: '14px',
                color: '#1a1a1a',
                fontWeight: '700'
              }}>{user?.email}</span>
            </div>

            <div style={{
              height: '1px',
              background: '#F0F9FF'
            }}/>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{
                fontSize: '14px',
                color: '#9ca3af',
                fontWeight: '600'
              }}>Member since</span>
              <span style={{
                fontSize: '14px',
                color: '#1a1a1a',
                fontWeight: '700'
              }}>
                {new Date(user?.created_at)
                  .toLocaleDateString('en', {
                    month: 'short',
                    year: 'numeric'
                  })
                }
              </span>
            </div>
          </div>
        </div>

        {/* Save Button when editing */}
        {editing && (
          <div style={{
            margin: '0 16px 16px 16px',
            animation: 'fadeUp 0.3s ease'
          }}>
            <button
              onClick={saveProfile}
              disabled={saving}
              style={{
                width: '100%',
                padding: '16px',
                background: '#00A8D6',
                color: 'white',
                border: 'none',
                borderRadius: '50px',
                fontFamily: "'Nunito', sans-serif",
                fontWeight: '800',
                fontSize: '16px',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(0,168,214,0.3)'
              }}
            >
              {saving ? 'Saving...' : 'Save Profile ✨'}
            </button>
          </div>
        )}

        {/* Saved confirmation */}
        {saved && (
          <div style={{
            position: 'fixed',
            bottom: '30px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#00A8D6',
            color: 'white',
            borderRadius: '50px',
            padding: '12px 24px',
            fontFamily: "'Nunito', sans-serif",
            fontWeight: '700',
            fontSize: '14px',
            zIndex: 100,
            animation: 'popIn 0.3s ease',
            whiteSpace: 'nowrap'
          }}>
            ✅ Profile saved!
          </div>
        )}
      </div>
    </div>
  )
}
