'use client'

import { useEffect, useState } from 'react'
import { FaTimes, FaQrcode, FaMapMarkerAlt, FaWalking } from 'react-icons/fa'
import { MdDirections, MdLocationOn, MdClose } from 'react-icons/md'

interface LocationPin {
  id: string
  name: string
  category: string
  description?: string | null
  latitude: number
  longitude: number
  writtenDirections?: string | null
  floor: string
}

interface DirectionsModalProps {
  location: LocationPin
  onClose: () => void
}

const KIOSK_LAT = parseFloat(process.env.NEXT_PUBLIC_KIOSK_LAT  || '-18.9718')
const KIOSK_LNG = parseFloat(process.env.NEXT_PUBLIC_KIOSK_LNG  || '32.6703')
const MAPS_KEY  = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

const CATEGORY_COLORS: Record<string, string> = {
  emergency: 'bg-red-500',
  pharmacy:  'bg-emerald-500',
  toilet:    'bg-blue-500',
  lab:       'bg-purple-500',
  cafeteria: 'bg-orange-500',
  atm:       'bg-yellow-500',
  parking:   'bg-slate-500',
  exit:      'bg-gray-500',
  ward:      'bg-cyan-500',
  entrance:  'bg-indigo-500',
}

export default function DirectionsModal({ location, onClose }: DirectionsModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const [tab, setTab] = useState<'map' | 'written' | 'qr'>('map')

  const mapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${KIOSK_LAT},${KIOSK_LNG}&destination=${location.latitude},${location.longitude}&travelmode=walking`
  const embedUrl = `https://www.google.com/maps/embed/v1/directions?key=${MAPS_KEY}&origin=${KIOSK_LAT},${KIOSK_LNG}&destination=${location.latitude},${location.longitude}&mode=walking&avoid=highways`

  useEffect(() => {
    // Dynamically import qrcode only on client
    import('qrcode').then(QRCode => {
      QRCode.toDataURL(mapsDirectionsUrl, {
        width: 220,
        margin: 2,
        color: { dark: '#1e3a8a', light: '#ffffff' },
        errorCorrectionLevel: 'M',
      }).then(setQrDataUrl)
    })
  }, [mapsDirectionsUrl])

  const colorClass = CATEGORY_COLORS[location.category] || 'bg-blue-600'

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/65 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`${colorClass} px-5 py-4 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <MdLocationOn className="text-white text-xl" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-tight">{location.name}</h2>
              <p className="text-xs text-white/75 font-medium capitalize">{location.floor} · {location.category}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <MdClose className="text-white text-xl" />
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
          {[
            { key: 'map',     icon: <MdDirections />,  label: 'Map' },
            { key: 'written', icon: <FaWalking />,     label: 'Directions' },
            { key: 'qr',      icon: <FaQrcode />,      label: 'QR Code' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as 'map' | 'written' | 'qr')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-all border-b-2 ${
                tab === t.key
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto">

          {/* MAP TAB */}
          {tab === 'map' && (
            <div className="h-80 w-full">
              <iframe
                src={embedUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={`Directions to ${location.name}`}
              />
            </div>
          )}

          {/* WRITTEN DIRECTIONS TAB */}
          {tab === 'written' && (
            <div className="p-5">
              {location.writtenDirections ? (
                <>
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`w-8 h-8 rounded-lg ${colorClass} flex items-center justify-center`}>
                      <FaWalking className="text-white text-sm" />
                    </div>
                    <h3 className="font-bold text-gray-800 dark:text-gray-100 text-base">Step-by-step directions</h3>
                  </div>
                  <div className="space-y-3">
                    {location.writtenDirections.split('\n').map((line, i) => (
                      line.trim() && (
                        <div key={i} className="flex items-start gap-3">
                          <div className="mt-0.5 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 text-xs font-bold flex items-center justify-center flex-shrink-0">
                            {i + 1}
                          </div>
                          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{line.trim()}</p>
                        </div>
                      )
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-10 text-gray-400 dark:text-gray-600">
                  <FaMapMarkerAlt className="text-4xl mx-auto mb-3 opacity-40" />
                  <p className="font-medium">No written directions set yet.</p>
                  <p className="text-sm mt-1">The admin can add directions via the Map Management tool.</p>
                </div>
              )}
            </div>
          )}

          {/* QR CODE TAB */}
          {tab === 'qr' && (
            <div className="flex flex-col items-center justify-center p-6 gap-5">
              <div className="text-center">
                <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg mb-1">Take directions with you</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Scan with your phone to open Google Maps walking directions
                </p>
              </div>
              <div className="qr-wrapper">
                {qrDataUrl
                  ? <img src={qrDataUrl} alt="QR code for directions" className="w-48 h-48 rounded-xl" />
                  : <div className="w-48 h-48 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center">
                      <span className="text-gray-400 text-sm animate-pulse-soft">Generating…</span>
                    </div>
                }
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-600">
                <FaWalking />
                <span>Walking directions · From kiosk to {location.name}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer close button */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-700 to-cyan-600 text-white font-bold text-base shadow-lg hover:opacity-95 transition-all active:scale-[0.98]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
